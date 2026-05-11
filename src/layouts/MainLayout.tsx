import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1d4ed8'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — hidden when printing */}
      <div className="no-print contents">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          userEmail={user?.email}
          onSignOut={signOut}
          themeColor={themeColor}
        />
      </div>

      {/* ─── Content ─── */}
      <main className="flex-1 overflow-auto">
        {/* Mobile topbar — hidden when printing */}
        <div className="no-print sticky top-0 z-20 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="เปิดเมนู"
          >
            <Menu size={18} />
          </button>
          <span className="ml-3 text-sm font-semibold text-slate-700">BillBlock ERP</span>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
