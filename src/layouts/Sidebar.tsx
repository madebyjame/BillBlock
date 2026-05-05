import type { Dispatch, SetStateAction } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Box,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Tag,
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

const TOP_NAV = [
  { to: '/', label: 'แดชบอร์ด', end: true, Icon: LayoutDashboard },
]

const SALES_NAV = [
  { to: '/documents/quotations',    label: 'ใบเสนอราคา',    Icon: FileText },
  { to: '/documents/invoices',      label: 'ใบแจ้งหนี้',    Icon: FileCheck },
  { to: '/documents/receipts',      label: 'ใบเสร็จรับเงิน', Icon: Receipt },
  { to: '/documents/billing-notes', label: 'ใบวางบิล',      Icon: ClipboardList },
  { to: '/documents/tax-invoices',  label: 'ใบกำกับภาษี',   Icon: Building2 },
]

const BOTTOM_NAV = [
  { to: '/customers', label: 'ลูกค้า',  end: false, Icon: Users },
  { to: '/products',  label: 'สินค้า',  end: false, Icon: Box },
  { to: '/settings',  label: 'ตั้งค่า', end: false, Icon: Settings },
]

function NavItem({ to, label, end = false, Icon, collapsed, onClick, themeColor }: {
  to: string; label: string; end?: boolean; Icon: React.ElementType
  collapsed: boolean; onClick: () => void; themeColor: string
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        ['flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
          isActive ? 'font-semibold text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
        ].join(' ')
      }
      style={({ isActive }) =>
        isActive ? { backgroundColor: `${themeColor}26`, outline: `1px solid ${themeColor}66` } : undefined
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function Sidebar({
  collapsed, setCollapsed, mobileOpen, setMobileOpen, userEmail, onSignOut, themeColor,
}: SidebarProps) {
  const close = () => setMobileOpen(false)

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-slate-950/45 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-100 shadow-xl transition-all duration-300 md:static md:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-20' : 'w-64',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b border-slate-800 px-3">
          {!collapsed && <span className="font-semibold tracking-tight text-slate-100">BillBlock ERP</span>}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="ml-auto hidden h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:flex"
            title={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
          <button
            onClick={close}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Top nav */}
          {TOP_NAV.map(item => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
          ))}

          {/* งานขาย section */}
          <div className="pt-3">
            {!collapsed && (
              <div className="mb-1 flex items-center gap-1.5 px-3">
                <Tag size={10} className="text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">งานขาย</span>
              </div>
            )}
            {collapsed && <div className="mb-1 h-px bg-slate-800 mx-2" />}
            {SALES_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>

          {/* Bottom nav */}
          <div className="pt-3">
            {!collapsed && <div className="mb-1 h-px bg-slate-800" />}
            {BOTTOM_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>
        </nav>

        {/* Footer */}
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
