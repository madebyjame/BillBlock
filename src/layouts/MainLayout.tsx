import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',           label: 'Dashboard',         end: true  },
  { to: '/documents',  label: 'เอกสารทั้งหมด',     end: false },
  { to: '/settings',   label: 'ตั้งค่าบริษัท',     end: false },
]

const PLACEHOLDER = ['ลูกค้า', 'สินค้า']

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ─── Sidebar ─── */}
      <aside className={`flex flex-col flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-200 ${collapsed ? 'w-16' : 'w-52'}`}>

        {/* Brand + Toggle */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3">
          {!collapsed && <span className="font-bold text-slate-800 tracking-tight">BillBlock</span>}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            title={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <NavIcon path={item.to} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          {/* Placeholder items (disabled) */}
          {PLACEHOLDER.map(label => (
            <div key={label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 cursor-not-allowed select-none"
              title="เร็วๆ นี้"
            >
              <span className="h-4 w-4 rounded bg-slate-100" />
              {!collapsed && (
                <span className="flex items-center gap-1.5 truncate">
                  {label}
                  <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-400">soon</span>
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* User + Sign Out */}
        <div className="border-t border-slate-100 px-2 py-3 space-y-0.5">
          {!collapsed && user?.email && (
            <p className="truncate px-3 pb-1 text-[11px] text-slate-400">{user.email}</p>
          )}
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* ─── Content ─── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

// ไอคอน minimal ตาม path
function NavIcon({ path }: { path: string }) {
  const cls = 'h-4 w-4 flex-shrink-0'
  if (path === '/')
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  if (path === '/documents')
    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
