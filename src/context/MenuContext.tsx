import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useGetMenu, type IMenuItem } from '@/components/Menu/menu-query'
import { useAuth } from './AuthContext'
import { useLang } from './LanguageContext'

// ── The menu ─────────────────────────────────────────────────────────────────
// One copy of the server's menu, shared by everything that needs to know what
// this person can reach: the sidebar draws it, the global search searches it,
// the breadcrumbs name pages from it.
//
// All three used to read the same hardcoded array. That was at least
// consistent — but it meant search could offer a page the sidebar had hidden,
// as soon as the sidebar learned to hide anything. Reading one server answer
// keeps them agreeing without anyone having to remember to.

/** A menu row with its children attached. */
export interface MenuNode extends IMenuItem {
  children: MenuNode[]
}

interface MenuCtx {
  /** The tree, in display order, already filtered for this person. */
  tree: MenuNode[]
  /** Every row with a route, groups flattened — for search and breadcrumbs. */
  flat: IMenuItem[]
  /** The row for a path, if the menu has one. */
  find: (route: string) => IMenuItem | undefined
  /** The group a route sits under, for the breadcrumb trail. */
  parentOf: (route: string) => IMenuItem | undefined
  /** The label in the current language. Never empty. */
  label: (item: IMenuItem) => string
  loading: boolean
}

const MenuContext = createContext<MenuCtx | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { lang } = useLang()

  // Not fetched for the operator: they are inside no company, so the endpoint
  // has nothing to answer with and the console draws its own nav. Asking anyway
  // would put a guaranteed empty response in every console page load.
  const inCompany = !!user && user.role !== 'SuperAdmin'

  const { data: items = [], isLoading } = useGetMenu(inCompany)

  const value = useMemo<MenuCtx>(() => {
    const byRoute = new Map(items.filter((i) => i.route).map((i) => [i.route, i]))
    const byKey = new Map(items.map((i) => [i.key, i]))

    const tree: MenuNode[] = items
      .filter((i) => !i.parentKey)
      .map((i) => ({
        ...i,
        children: items.filter((c) => c.parentKey === i.key).map((c) => ({ ...c, children: [] })),
      }))

    const label = (item: IMenuItem) =>
      lang === 'np' ? item.labelNe || item.label : item.label

    return {
      tree,
      flat: items.filter((i) => i.route),
      find: (route) => byRoute.get(route),
      parentOf: (route) => {
        const item = byRoute.get(route)
        return item?.parentKey ? byKey.get(item.parentKey) : undefined
      },
      label,
      loading: inCompany && isLoading,
    }
  }, [items, isLoading, inCompany, lang])

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
