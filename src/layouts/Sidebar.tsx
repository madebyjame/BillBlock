import type { Dispatch, SetStateAction } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  Box,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileCheck,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Tag,
  Users,
  X,
  Zap,
  BarChart3,
  FileBarChart2,
  TrendingUp,
  Wallet,
  MinusCircle,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react'
import { usePlan } from '../hooks/usePlan'

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
  { to: '/dashboard', label: 'แดชบอร์ด', end: true, Icon: LayoutDashboard },
]

const SALES_NAV = [
  { to: '/documents/quotations',    label: 'ใบเสนอราคา',     Icon: FileText },
  { to: '/documents/invoices',      label: 'ใบแจ้งหนี้',     Icon: FileCheck },
  { to: '/documents/receipts',      label: 'ใบเสร็จรับเงิน', Icon: Receipt },
  { to: '/documents/billing-notes', label: 'ใบวางบิล',       Icon: ClipboardList },
  { to: '/documents/tax-invoices',  label: 'ใบกำกับภาษี',    Icon: Building2 },
  { to: '/documents/credit-notes',  label: 'ใบลดหนี้',        Icon: MinusCircle },
]

const INVENTORY_NAV = [
  { to: '/inventory/products',    label: 'รายการสินค้า',       Icon: Box },
  { to: '/inventory/adjustments', label: 'รับเข้า/ปรับสต็อก', Icon: ArrowLeftRight },
  { to: '/inventory/movements',   label: 'ประวัติสต็อก',       Icon: History },
]

const REPORTS_NAV = [
  { to: '/reports/pl',              label: 'กำไร & ขาดทุน',    Icon: TrendingUp },
  { to: '/reports/ar-aging',        label: 'AR Aging',          Icon: AlertCircle },
  { to: '/reports/sales-by-product',label: 'ยอดขายต่อสินค้า', Icon: ShoppingCart },
  { to: '/reports/vat',             label: 'VAT (ภ.พ.30)',      Icon: BarChart3 },
  { to: '/reports/wht',             label: 'WHT (ภ.ง.ด.3/53)', Icon: FileBarChart2 },
]

const BOTTOM_NAV = [
  { to: '/customers', label: 'ลูกค้า',      end: false, Icon: Users },
  { to: '/expenses',  label: 'ค่าใช้จ่าย', end: false, Icon: Wallet },
  { to: '/settings',  label: 'ตั้งค่า',     end: false, Icon: Settings },
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
        ['flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
          isActive ? 'font-semibold text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
        ].join(' ')
      }
      style={({ isActive }) =>
        isActive ? { backgroundColor: `${themeColor}30`, outline: `1px solid ${themeColor}55` } : undefined
      }
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isNear = pct >= 80
  const isFull = pct >= 100
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className={isFull ? 'text-red-400' : isNear ? 'text-amber-400' : ''}>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : isNear ? 'bg-amber-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SectionLabel({ label, Icon, collapsed }: { label: string; Icon: React.ElementType; collapsed: boolean }) {
  if (collapsed) return <div className="mb-1 h-px bg-slate-800 mx-2" />
  return (
    <div className="mb-1 flex items-center gap-1.5 px-3">
      <Icon size={10} className="text-slate-500" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  )
}

export default function Sidebar({
  collapsed, setCollapsed, mobileOpen, setMobileOpen, userEmail, onSignOut, themeColor,
}: SidebarProps) {
  const close = () => setMobileOpen(false)
  const navigate = useNavigate()
  const { plan, usage, limits, loading: planLoading } = usePlan()

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
          collapsed ? 'w-[72px]' : 'w-72',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-slate-800/60 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-900/40">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-white">BillBlock</p>
                <p className="text-[10px] text-slate-500 leading-none">ERP Platform</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-900/40">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            className="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-white md:flex"
            title={collapsed ? 'ขยาย' : 'ย่อ'}
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
          <button
            onClick={close}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Top nav */}
          {TOP_NAV.map(item => (
            <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
          ))}

          {/* งานขาย */}
          <div className="pt-3">
            <SectionLabel label="งานขาย" Icon={Tag} collapsed={collapsed} />
            {SALES_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>

          {/* คลังสินค้า */}
          <div className="pt-3">
            <SectionLabel label="คลังสินค้า" Icon={Package} collapsed={collapsed} />
            {INVENTORY_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>

          {/* รายงานภาษี */}
          <div className="pt-3">
            <SectionLabel label="รายงานภาษี" Icon={BarChart3} collapsed={collapsed} />
            {REPORTS_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>

          {/* ลูกค้า + ตั้งค่า */}
          <div className="pt-3">
            {!collapsed && <div className="mb-1 h-px bg-slate-800" />}
            {BOTTOM_NAV.map(item => (
              <NavItem key={item.to} {...item} collapsed={collapsed} onClick={close} themeColor={themeColor} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-2 py-3 space-y-2">
          {/* Usage bar — free plan only */}
          {!collapsed && !planLoading && plan === 'free' && (
            <div className="rounded-lg bg-slate-800/70 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">แผน Free</span>
                <button
                  onClick={() => navigate('/settings/billing')}
                  className="flex items-center gap-1 rounded-md bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 hover:bg-blue-600/30 transition-colors"
                >
                  <Zap size={9} />
                  Upgrade
                </button>
              </div>
              <UsageBar used={usage.docsThisMonth} limit={limits.docsPerMonth} label="เอกสาร/เดือน" />
              <UsageBar used={usage.totalCustomers}  limit={limits.customers}     label="ลูกค้า" />
              <UsageBar used={usage.totalProducts}   limit={limits.products}      label="สินค้า" />
            </div>
          )}

          {!collapsed && (
            <div className="rounded-lg bg-slate-800/70 px-3 py-2">
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
