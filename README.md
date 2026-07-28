# GarageFlow — Workshop Management Dashboard

A premium, responsive admin dashboard for auto workshops. Manage customers,
vehicles, job cards, service history and billing from one clean UI.

Built to match the same stack as the rest of your projects — **React 18 +
TypeScript + Vite + Tailwind + Recharts + Heroicons** — with **TanStack Query**
added so the data layer is ready to talk to your .NET / Swagger API.

## Features

- 🔐 **Login** — JWT auth with refresh-token rotation, plus emailed password reset
- 📊 **Dashboard** — KPIs, revenue trend, job-status donut, live activity
- 👥 **Customers** — searchable table, add/edit/delete, CSV export
- 🚗 **Vehicles** — filter by fuel type, full CRUD, odometer tracking
- 🧾 **Job Cards** — kanban board + list view, parts & labour lines, status flow
- 🔧 **Service History** — timeline of completed jobs
- 💳 **Billing** — invoices, record payments (Cash / Card / eSewa / Khalti / Bank), dues tracking
- 📈 **Reports** — revenue, jobs, revenue-by-mechanic, collections-by-method, top customers
- 🌗 Light / dark theme, toasts, confirm dialogs, fully responsive

## Getting started

```bash
npm install
npm run dev      # http://localhost:5000  (start ../garageflow-api first)
```

Build for production:

```bash
npm run build
npm run preview
```

## How the data layer works

The app talks to the **GarageFlow .NET API** (`../garageflow-api`, default
`http://localhost:5100/api`). There is no mock store — start the API first, or
every page shows an error state.

The architecture follows the ERP-Client convention: each feature owns its
endpoints, its schema and its query hooks, and pages are composition only.

```
src/components/Customer/
├── customer-api.ts      # endpoint definitions  { actionName, controllerName, requestMethod }
├── customer-schema.ts   # ICustomer + Yup schema + inferred form type + initial values
├── customer-query.ts    # useGetCustomerList / useAddCustomer / useUpdateCustomer / …
├── CustomerTable.tsx    # column definitions + DataTable
└── CustomerForm.tsx     # Formik add/edit modal

src/pages/Customers.tsx  # ~60 lines: fetch, filter, compose
```

The same five-file shape exists for `Vehicle/`, `JobCard/`, `Invoice/`,
`Dashboard/`, `Report/` and `ServiceHistory/`.

### The request pipeline

Every call goes through one place. **Never call `axios` or `fetch` from a
component.**

```
Page → *-query.ts hook → initApiRequest({ apiDetails })
                          → lib/api-schema.ts (URL, headers, body shaping)
                          → axios → .NET API
```

| File | Role |
|------|------|
| `src/lib/api-types.ts` | `RequestMethod`, `RequestBodyType`, `ApiDetailType` |
| `src/lib/api-schema.ts` | path variables, headers, FormData, error normalisation |
| `src/lib/api-request.ts` | `initApiRequest` — the single request function |
| `src/utils/http.exception.ts` | `HttpException` thrown on failure |
| `src/constants/config/getEndpoints.ts` | resolves the API root from `config.json` |

One deliberate difference from ERP-Client: **`controllerName` is a path, not a
full URL** (`/customers/{id}`). ERP reads a synchronously-loaded config so it can
bake absolute URLs at import time; GarageFlow fetches `public/config.json`
asynchronously before the first render, so the origin is resolved per request.

### The response envelope

Every endpoint answers with `{ data, status, message, errors }`, so the payload
is at `res?.data?.data`:

```ts
select: (res) => res?.data?.data ?? null
```

**`message` is written by the API and shown verbatim.** Mutations toast
`res?.data?.message`; the hardcoded string beside it is only a fallback for a
response that carries none. Errors work the same way — `manageErrorResponse`
lifts the server's `message` onto the thrown `HttpException`, so
`error.message` in an `onError` is already the sentence to display.

Do not compose success or failure wording in the UI. When a payment is clamped
to the outstanding balance, only the server knows how much it actually took.

### Lists and paging

List endpoints wrap the payload once more, in `{ count, list }`. `count` is the
total across all pages, so a pager sizes itself from one response.

Each feature exposes two read hooks:

| Hook | Returns | Use for |
|------|---------|---------|
| `useGetCustomerList()` | `ICustomer[]` — every row | dashboard, reports, dropdowns, global search |
| `useGetCustomerListPaged(params)` | `{ count, list }` | server-mode tables |
| `useFetchAllCustomers()` | `() => Promise<ICustomer[]>` | CSV export of the whole filtered set |

Paging is `skip`/`take`; omitting `take` returns everything. See
**Server-side tables** below.

### Adding an endpoint

1. Add the entry to the feature's `*-api.ts` with a unique `actionName` — it
   doubles as the React Query key.
2. Add a hook to `*-query.ts` using `initApiRequest`, with
   `select: (res) => res?.data?.data` (or `?.data?.data?.list` for a list).
3. If it takes a body, add the Yup schema and inferred type to `*-schema.ts`.
4. Mutations invalidate by `actionName` and toast `res?.data?.message`.

### Forms

Formik + Yup throughout. The schema in `*-schema.ts` is the single source of
truth — the form's TypeScript type is `Yup.InferType<typeof schema>`, so a field
cannot drift between validation and form state.

Use the shared controls rather than raw inputs:
`components/common/form/Input.tsx` (Formik-bound text/number/date) and
`components/common/form/FormikDropdown.tsx` (Formik-bound `Dropdown`).

### Configuration

`public/config.json` is fetched at run time, so one build works against any
backend — no rebuild, no environment variables:

```json
{
  "baseUrl": [{ "localhost": "http://localhost:5100" }],
  "apiPath": "/api",
  "useMockApi": false
}
```

`VITE_API_BASE` in `.env` overrides it for local work. See `.env.example`.

### Server-side tables

The Customers, Vehicles, Job Cards (list view) and Billing tables are **server
paged**: the API decides the page, the sort and the filtering. The browser never
holds the full table.

`useTableState` holds the page / size / sort and converts it to `skip`/`take`.
Pass the page's filters as its second argument and it returns to page 1 whenever
one changes — otherwise narrowing a search while on page 4 asks for rows past
the end of the new result set.

```tsx
const search = useDebouncedValue(query)          // one request per pause, not per keystroke
const table = useTableState({ pageSize: 20 }, [search, fuel])
const { data, isFetching } = useGetVehicleListPaged(table.toQuery({ search, fuel }))

<VehicleTable
  data={data?.list ?? []}
  total={data?.count ?? 0}    // full total — sizes the pager
  state={table.state}
  onStateChange={table.setState}
  loading={isFetching}
  …
/>
```

A column's `key` is sent as `sortBy`, so it has to match a property on the
server's DTO. Two consequences worth knowing:

- Priority sorts alphabetically, not by severity — the API stores it as a string.
- The Job Cards **board** is not paged. It groups every open job into columns, so
  it fetches the lot and filters in-browser; only the list view pages.

`DataTable` still supports client mode (omit `serverMode` and pass the full
array) for small static lists.

## Authentication

Sign in with the seeded demo account — the login form is prefilled with it:

| Company code | Email | Password |
| --- | --- | --- |
| `DEMO` | `bijaymishra276@gmail.com` | `demo1234` |

Clear `loginInitialValues` in `src/components/Auth/auth-schema.ts` before this
goes anywhere real; a login form that fills in working credentials is a back door.

### Where the pieces live

| File | Role |
|------|------|
| `src/components/Auth/auth-api.ts` | the seven `/auth/*` endpoints |
| `src/components/Auth/auth-schema.ts` | `IAuthUser`, Yup schemas, prefilled demo values |
| `src/components/Auth/auth-query.ts` | `useLogin`, `useLogout`, `useGetCurrentUser`, … |
| `src/lib/authStorage.ts` | the only module that knows where tokens live |
| `src/context/AuthContext.tsx` | holds the user; `signIn` / `signOut` |
| `src/components/ProtectedRoute.tsx` | redirects to `/login`, remembering where you were |

### The token flow

`getRequestHeaders` in `lib/api-schema.ts` reads the access token **per
request** and adds `Authorization: Bearer …`. Endpoints declared
`RequestBodyType.NO_AUTH` (login, forgot-password, reset-password) get no header
— a stale token must not travel with a sign-in attempt.

`initApiRequest` handles expiry. On a 401 it refreshes once and replays the
request; if the refresh also fails it clears the session and the app returns to
the login screen:

```
request ──401──► refresh ──ok──► replay the original request
                    │
                    └──fail──► clearSession() → back to /login
```

Two details worth knowing:

- **Concurrent 401s share one refresh.** A page fires several queries at once,
  so an expired token produces a burst of 401s. They all await the same
  in-flight promise — otherwise each would spend the refresh token, and the
  server's rotation would invalidate the others.
- **A 401 from a NO_AUTH endpoint is not refreshed.** It means wrong
  credentials, so the server's message reaches the user instead.

Sign-out calls `/auth/logout` to revoke the refresh token, then clears local
state — but clears it either way, so a failed call cannot trap someone in a
session they asked to leave.

### Token storage

`localStorage`, in `src/lib/authStorage.ts`. Readable by any script on the
origin, so an XSS bug leaks the token. The stronger option is an httpOnly cookie
the browser attaches automatically — that needs `withCredentials`, a same-site
policy and CSRF protection on the API. Worth doing before this handles real
customer data; `authStorage.ts` is the only file that would change.

### Password reset

`/forgot-password` → the API emails a link to
`/reset-password?token=…` → `ResetPassword.tsx` posts the token with the new
password. The client never validates the token; only the server can.

With SMTP unconfigured the API writes the link to its console instead of sending
it — see the API README.

## Project structure

```
src/
├── components/
│   ├── Auth/           # -api / -schema / -query for sign-in and password reset
│   ├── Customer/       # -api / -schema / -query + Table + Form
│   ├── Vehicle/
│   ├── JobCard/
│   ├── Invoice/
│   ├── Dashboard/
│   ├── Report/
│   ├── ServiceHistory/
│   ├── charts/         # Recharts wrappers
│   ├── common/         # Badge, StatCard, Modal, form controls, DataTable…
│   └── layout/         # Sidebar, Topbar, GlobalSearch, Layout
├── constants/config/   # API root resolution
├── context/            # Theme, Auth, Toast, Confirm, Workspace
├── data/               # static workshop/branch config (no API behind it yet)
├── hooks/              # generic helpers — useSearchQuery, useSort, useTableState
├── lib/                # api-request, api-schema, api-types, format, status, csv
├── pages/              # thin composition
├── types/              # ambient app types (app.d.ts)
└── utils/              # sanitizer, http.exception
```

## Roadmap (v2 ideas)

Mechanic app · Customer booking app · Inventory & spare parts · SMS/WhatsApp
reminders · Appointment scheduling · QR check-in · Multi-branch · Online payments.
