import type { Dispatch, SetStateAction } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Box,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  X,
} from 'lucide-react'

type SidebarProps = {
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
  mobileOpen: boolean
  setMobileOpen: Dispatch<SetStateAction<boolean>>
  userEmail?: string
  onSignOut: () => Promise<void>
  themeColor: string
}

const NAV_ITEMS = [
  { to: '/', label: 'แดชบอร์ด', end: true, Icon: LayoutDashboard },
  { to: '/documents', label: 'เอกสารทั้งหมด', end: false, Icon: FileText },
  { to: '/settings', label: 'ตั้งค่า', end: false, Icon: Settings },
]

const DISABLED_ITEMS = [
  { label: 'ลูกค้า', Icon: Users },
  { label: 'สินค้า', Icon: Box },
]

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  userEmail,
  onSignOut,
  themeColor,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-slate-950/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-100 shadow-xl transition-all duration-300 md:static md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-20' : 'w-72',
        ].join(' ')}
      >
        <div className="flex h-14 items-center border-b border-slate-800 px-3">
          {!collapsed && <span className="font-semibold tracking-tight text-slate-100">BillBlock ERP</span>}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="ml-auto hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:flex"
            title={collapsed ? 'ขยาย' : 'ย่อ'}
            aria-label={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="ปิดเมนู"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                  isActive ? 'font-semibold text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: `${themeColor}26`,
                      outline: `1px solid ${themeColor}66`,
                    }
                  : undefined
              }
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          <div className="my-3 border-t border-slate-800" />

          {DISABLED_ITEMS.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500"
              title="เร็วๆ นี้"
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <span className="flex items-center gap-1.5 truncate">
                  {label}
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">soon</span>
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-2 py-3">
          {!collapsed && (
            <div className="mb-2 rounded-lg bg-slate-800/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Signed in as</p>
              <p className="truncate text-xs text-slate-100">{userEmail ?? '-'}</p>
            </div>
          )}
          <button
            onClick={() => void onSignOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
