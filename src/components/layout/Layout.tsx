import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ImpersonationBanner from '@/components/SuperAdmin/ImpersonationBanner'
import SupportWidget, { showSupportWidget } from '@/components/Support/SupportWidget'
import { useGetCurrentUser } from '@/components/Auth/auth-query'
import { useAuth } from '@/context/AuthContext'

const COLLAPSE_KEY = 'gf_sidebar_collapsed'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  // Re-reads the signed-in user from the token on mount. A session restored
  // from localStorage is only a claim: this is what catches an account that was
  // deactivated or a name that changed elsewhere. A dead token 401s here, and
  // the request layer ends the session.
  const { setUser, user } = useAuth()
  const { data: currentUser } = useGetCurrentUser()

  useEffect(() => {
    if (currentUser) setUser(currentUser)
  }, [currentUser, setUser])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={mobileOpen} collapsed={collapsed} onClose={() => setMobileOpen(false)} />
      <div className={collapsed ? 'lg:pl-20' : 'lg:pl-72'}>
        {/* Above the topbar, in flow rather than fixed — the sidebar is
            `fixed inset-y-0`, so a pinned strip would sit on top of it. Renders
            nothing at all in an ordinary session. */}
        <ImpersonationBanner />
        <Topbar collapsed={collapsed} onMenu={() => setMobileOpen(true)} onToggleCollapse={() => setCollapsed((c) => !c)} />
        {/* Full-bleed: tables should use the whole viewport width. */}
        <main className="w-full px-3 py-4 sm:px-4 lg:px-5">
          <Outlet />
        </main>
      </div>

      {/* The workshop's own line to GarageFlow. Floats over the content on
          purpose: the questions it answers are asked *while* somebody is stuck
          on another screen, and making them navigate away to ask about the
          screen they are on is the wrong shape. */}
      {showSupportWidget(user?.role) && <SupportWidget />}
    </div>
  )
}
