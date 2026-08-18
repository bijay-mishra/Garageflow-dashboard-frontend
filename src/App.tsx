import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import ModuleRoute from '@/components/ModuleRoute'
import Login from '@/pages/Login'
import PasswordReset from '@/pages/PasswordReset'
import SetPassword from '@/pages/SetPassword'
import Account from '@/pages/Account'
import Dashboard from '@/pages/Dashboard'
import Customers from '@/pages/Customers'
import Vehicles from '@/pages/Vehicles'
import JobCards from '@/pages/JobCards'
import Services from '@/pages/Services'
import Bookings from '@/pages/Bookings'
import ServiceHistory from '@/pages/ServiceHistory'
import Billing from '@/pages/Billing'
import Deliveries from '@/pages/Deliveries'
import InvoicePrint from '@/pages/InvoicePrint'
import Reports from '@/pages/Reports'
import Plans from '@/pages/Plans'
import WorkshopSettings from '@/pages/WorkshopSettings'
import Staff from '@/pages/Staff'
import Support from '@/pages/Support'
import RoleMenus from '@/pages/RoleMenus'
import Configuration from '@/pages/Configuration'
import SuperAdminLogin from '@/pages/SuperAdminLogin'
import SuperAdminLayout from '@/components/SuperAdmin/SuperAdminLayout'
import SuperAdminRoute from '@/components/SuperAdmin/SuperAdminRoute'
import SuperAdminOverview from '@/pages/superadmin/Overview'
import SuperAdminCompanies from '@/pages/superadmin/Companies'
import SuperAdminCompanyDetail from '@/pages/superadmin/CompanyDetail'
import SuperAdminAppCustomers from '@/pages/superadmin/AppCustomers'
import SuperAdminConfiguration from '@/pages/superadmin/Configuration'
import SuperAdminSupport from '@/pages/superadmin/Support'
import SuperAdminAudit from '@/pages/superadmin/AuditLog'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* The operator console. Outside <Layout> on purpose: the sidebar,
          workspace pickers and module gate are all built for somebody inside
          one company, and none of them mean anything here. */}
      {/* The operator door. A route with no children, so it matches
          /superadmin exactly and the layout below takes the rest. */}
      <Route path="/superadmin" element={<SuperAdminLogin />} />
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        }
      >
        <Route path="overview" element={<SuperAdminOverview />} />
        <Route path="companies" element={<SuperAdminCompanies />} />
        <Route path="companies/:code" element={<SuperAdminCompanyDetail />} />
        <Route path="app-customers" element={<SuperAdminAppCustomers />} />
        <Route path="support" element={<SuperAdminSupport />} />
        <Route path="configuration" element={<SuperAdminConfiguration />} />
        <Route path="audit" element={<SuperAdminAudit />} />
      </Route>
      {/* One screen, three steps, two doors into it. /forgot-password starts at
          the beginning; /reset-password is where the emailed button lands,
          carrying ?company=&email= so it opens on the code step with the
          account already filled in. */}
      <Route path="/forgot-password" element={<PasswordReset />} />
      <Route path="/reset-password" element={<PasswordReset />} />

      {/* Signed in, but nothing works yet: this account is still on the password
          somebody handed it, and its token reaches only /auth/set-password.
          Outside <Layout> because a sidebar whose every link 403s is worse than
          no sidebar. ProtectedRoute redirects here from anywhere else. */}
      <Route
        path="/set-password"
        element={
          <ProtectedRoute>
            <SetPassword />
          </ProtectedRoute>
        }
      />

      {/* Signed in, but outside <Layout> — the printable bill is a document, and
          it opens in its own tab with no sidebar or topbar around it. Putting it
          inside the layout would mean fighting the app chrome in print CSS. */}
      <Route
        path="/invoices/:id/print"
        element={
          <ProtectedRoute>
            <InvoicePrint />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Always on: the records themselves, your own account, and the
            workshop's own details. A company with these switched off would have
            nothing to sign in for. */}
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="job-cards" element={<JobCards />} />
        <Route path="account" element={<Account />} />
        <Route path="workshop" element={<WorkshopSettings />} />
        <Route path="plans" element={<Plans />} />

        {/* Owner and manager only. Not module-gated: every workshop has roles,
            and deciding what they see is not an add-on. */}
        <Route path="role-menus" element={<RoleMenus />} />
        <Route path="configuration" element={<Configuration />} />

        {/* Not module-gated. A workshop that can be asked a question can always
            answer it, and a hidden inbox is an unanswered customer. */}
        <Route path="support" element={<Support />} />

        {/* Optional, and hidden from the sidebar when off. Wrapped here as well
            so a bookmark or a pasted link lands on an explanation rather than on
            a working screen the workshop was never given. */}
        <Route path="services" element={<ModuleRoute module="services"><Services /></ModuleRoute>} />
        <Route
          path="service-history"
          element={<ModuleRoute module="serviceHistory"><ServiceHistory /></ModuleRoute>}
        />
        <Route path="billing" element={<ModuleRoute module="billing"><Billing /></ModuleRoute>} />
        <Route path="deliveries" element={<ModuleRoute module="deliveries"><Deliveries /></ModuleRoute>} />
        <Route path="reports" element={<ModuleRoute module="reports"><Reports /></ModuleRoute>} />
        <Route path="staff" element={<ModuleRoute module="staff"><Staff /></ModuleRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
