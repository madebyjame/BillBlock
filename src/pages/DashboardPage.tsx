import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, FileText, Users, FilePlus, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import BentoGrid from '../components/BentoGrid'
import type { DashboardData, DashboardDoc, ProductAlert, SpenderEntry } from '../types/dashboard'

interface DashboardDoc {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  total_amount: number
  created_at: string
  content: unknown
}

type SortCol = 'created_at' | 'total_amount'
type SortDir = 'asc' | 'desc'

const STATUS_LABEL: Record<DashboardDoc['status'], string> = {
  draft:     'ฉบับร่าง',
  sent:      'ส่งแล้ว',
  paid:      'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const STATUS_CLASS: Record<DashboardDoc['status'], string> = {
  draft:     'bg-slate-200 text-slate-700',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation:      'ใบเสนอราคา',
  invoice:        'ใบแจ้งหนี้',
  receipt:        'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice':  'ใบกำกับภาษี',
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtYAxis(n: number): string {
  if (n === 0) return '0'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return n.toLocaleString('th-TH')
}

function niceMax(n: number): number {
  if (n === 0) return 1000
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  const norm = n / mag
  if (norm <= 1) return mag
  if (norm <= 2) return 2 * mag
  if (norm <= 5) return 5 * mag
  return 10 * mag
}

function getCustomerName(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'customer' in content) {
    const c = (content as { customer?: { name?: unknown } }).customer
    if (c && typeof c.name === 'string' && c.name.trim()) return c.name
  }
  return '—'
}

// ─── SVG Line Chart with Y-axis ───────────────────────────────────────────────

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) return (
    <div className="flex h-44 items-center justify-center text-sm text-slate-300">ยังไม่มีข้อมูลเพียงพอ</div>
  )

  const W = 560
  const H = 170
  const PL = 52   // left padding for Y-axis labels
  const PR = 8
  const PT = 12
  const PB = 22   // bottom padding for X-axis labels

  const innerW = W - PL - PR
  const innerH = H - PT - PB

  const maxVal = Math.max(...data.map(d => d.value))
  const yMax = niceMax(maxVal)
  const yTicks = [0, yMax * 0.5, yMax]

  const pts = data.map((d, i) => ({
    x: PL + (i / (data.length - 1)) * innerW,
    y: PT + (1 - d.value / yMax) * innerH,
    label: d.label,
    value: d.value,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + innerH).toFixed(1)} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 176 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines + labels */}
      {yTicks.map((tick) => {
        const y = (PT + (1 - tick / yMax) * innerH).toFixed(1)
        return (
          <g key={tick}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PL - 6} y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" fontSize="10">
              {fmtYAxis(tick)}
            </text>
          </g>
        )
      })}

      {/* Area + Line */}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {pts.map((p) => (
        <circle key={p.label} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="white" stroke="#3b82f6" strokeWidth="2" />
      ))}

      {/* X-axis labels */}
      {pts.map((p) => (
        <text key={`x-${p.label}`} x={p.x.toFixed(1)} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize="11">
          {p.label}
        </text>
      ))}
    </svg>
  )
}
const LOW_STOCK_THRESHOLD = 10

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (col !== sortCol) return <ChevronsUpDown size={13} className="text-slate-300" />
  return sortDir === 'asc'
    ? <ChevronUp size={13} className="text-slate-500" />
    : <ChevronDown size={13} className="text-slate-500" />
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingCollection, setPendingCollection] = useState(0)
  const [quotationsValue, setQuotationsValue] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{ label: string; value: number }[]>([])
  const [allRecentDocs, setAllRecentDocs] = useState<DashboardDoc[]>([])
  const [sortCol, setSortCol] = useState<SortCol>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'
  const { layout, updateLayout } = useDashboardLayout()

  const themeColor =
    typeof user?.user_metadata?.themeColor === 'string'
      ? user.user_metadata.themeColor
      : '#1e3a8a'

  const [dashData, setDashData] = useState<DashboardData>({
    loading: true,
    revenue30d: 0,
    pendingAmount: 0,
    pendingCount: 0,
    sparkline: [],
    pendingDocs: [],
    recentDocs: [],
    lowStockProducts: [],
    topSpenders: [],
    customerCount: 0,
    companyName: '',
    themeColor,
  })

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [docsRes, countRes, profileRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, doc_type, status, total_amount, created_at, content')
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('company_name')
          .maybeSingle(),
      ])

      const docs = (docsRes.data ?? []) as DashboardDoc[]

      setCompanyName(
        typeof profileRes.data?.company_name === 'string' && profileRes.data.company_name.trim()
          ? profileRes.data.company_name
          : ''
      )

      setTotalRevenue(
        docs.filter(d => d.doc_type === 'invoice' && d.status === 'paid')
          .reduce((s, d) => s + d.total_amount, 0)
      )
      setPendingCollection(
        docs.filter(d => d.doc_type === 'invoice' && d.status === 'sent')
          .reduce((s, d) => s + d.total_amount, 0)
      )
      setQuotationsValue(
        docs.filter(d => d.doc_type === 'quotation')
          .reduce((s, d) => s + d.total_amount, 0)
      )
      setTotalCustomers(countRes.count ?? 0)

      const now = new Date()
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return {
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('th-TH', { month: 'short' }),
          value: 0,
        }
      })
      for (const doc of docs.filter(d => d.doc_type === 'invoice' && d.status === 'paid')) {
        const key = doc.created_at.slice(0, 7)
        const m = months.find(m => m.key === key)
        if (m) m.value += doc.total_amount
      }
      setMonthlyData(months.map(({ label, value }) => ({ label, value })))
      setAllRecentDocs(docs.slice(0, 20))
    } finally {
      setLoading(false)
    setDashData(prev => ({ ...prev, loading: true }))

    const [docsRes, productsRes, countRes, profileRes] = await Promise.all([
      supabase
        .from('documents')
        .select('id, doc_type, status, total_amount, created_at, content')
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('id, name, stock, unit')
        .lt('stock', LOW_STOCK_THRESHOLD)
        .order('stock', { ascending: true }),
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('company_name')
        .maybeSingle(),
    ])

    const docs = (docsRes.data ?? []) as DashboardDoc[]
    const now = new Date()

    // ── Revenue: last 30 days ────────────────────────────────────────────────
    const cutoff30d = new Date(now.getTime() - 30 * 86_400_000).toISOString()
    const revenue30d = docs
      .filter(d => d.doc_type === 'invoice' && d.status === 'paid' && d.created_at >= cutoff30d)
      .reduce((s, d) => s + d.total_amount, 0)

    // ── Sparkline: 14-day daily paid invoices ────────────────────────────────
    const sparklineDays = 14
    const sparklineMap = new Map<string, number>()
    for (let i = sparklineDays - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      sparklineMap.set(key, 0)
    }
    for (const doc of docs) {
      if (doc.doc_type !== 'invoice' || doc.status !== 'paid') continue
      const key = doc.created_at.slice(0, 10)
      if (sparklineMap.has(key)) {
        sparklineMap.set(key, (sparklineMap.get(key) ?? 0) + doc.total_amount)
      }
    }
    const sparkline = [...sparklineMap.entries()].map(([key, value]) => ({
      label: new Date(key).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      value,
    }))

    // ── Pending invoices ─────────────────────────────────────────────────────
    const pendingDocs = docs.filter(d => d.doc_type === 'invoice' && d.status === 'sent')
    const pendingAmount = pendingDocs.reduce((s, d) => s + d.total_amount, 0)

    // ── Top spenders: this month ─────────────────────────────────────────────
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const spenderMap = new Map<string, number>()
    for (const doc of docs) {
      if (doc.doc_type !== 'invoice' || doc.status !== 'paid') continue
      if (doc.created_at < monthStart) continue
      const name = getCustomerName(doc.content)
      spenderMap.set(name, (spenderMap.get(name) ?? 0) + doc.total_amount)
    }
    const topSpenders: SpenderEntry[] = [...spenderMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }))

    // ── Low-stock products ───────────────────────────────────────────────────
    const lowStockProducts: ProductAlert[] = (productsRes.data ?? []) as ProductAlert[]

    // ── Company name ─────────────────────────────────────────────────────────
    const companyName =
      typeof profileRes.data?.company_name === 'string' && profileRes.data.company_name.trim()
        ? profileRes.data.company_name
        : ''

    setDashData({
      loading: false,
      revenue30d,
      pendingAmount,
      pendingCount: pendingDocs.length,
      sparkline,
      pendingDocs,
      recentDocs: docs.slice(0, 20),
      lowStockProducts,
      topSpenders,
      customerCount: countRes.count ?? 0,
      companyName,
      themeColor,
    })
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const recentDocs = [...allRecentDocs]
    .sort((a, b) => {
      const aVal = sortCol === 'created_at' ? a.created_at : a.total_amount
      const bVal = sortCol === 'created_at' ? b.created_at : b.total_amount
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    .slice(0, 8)

  const displayName = companyName || 'ผู้ใช้งาน'

  const kpiCards = [
    {
      label: 'รายได้รวม',
      value: `฿${fmtAmount(totalRevenue)}`,
      sub: 'ใบแจ้งหนี้ที่ชำระแล้ว',
      icon: <TrendingUp size={18} />,
      iconClass: 'bg-green-50 text-green-600',
    },
    {
      label: 'รอเรียกเก็บ',
      value: `฿${fmtAmount(pendingCollection)}`,
      sub: 'ใบแจ้งหนี้ที่ค้างชำระ',
      icon: <Clock size={18} />,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'ยอดเสนอราคา',
      value: `฿${fmtAmount(quotationsValue)}`,
      sub: 'ใบเสนอราคาทั้งหมด',
      icon: <FileText size={18} />,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'ลูกค้าทั้งหมด',
      value: totalCustomers.toLocaleString('th-TH'),
      sub: 'จำนวนลูกค้าในระบบ',
      icon: <Users size={18} />,
      iconClass: 'bg-purple-50 text-purple-600',
    },
  ]
  const displayName = dashData.companyName || user?.email?.split('@')[0] || 'ผู้ใช้งาน'

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">ยินดีต้อนรับ, {displayName}</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClass}`}>
              {card.icon}
            </div>
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="mt-0.5 text-xl font-bold leading-tight text-slate-800">
              {loading
                ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-100" />
                : card.value
              }
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">รายได้รายเดือน</h2>
          <span className="text-xs text-slate-400">ใบแจ้งหนี้ที่ชำระแล้ว (6 เดือนล่าสุด)</span>
        </div>
        {loading ? (
          <div className="flex h-44 items-center justify-center">
            <svg className="h-5 w-5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <LineChart data={monthlyData} />
        )}
      </div>

      {/* Recent Transactions */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-700">เอกสารล่าสุด</h2>
          <button
            onClick={() => navigate('/documents/invoices')}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            ดูทั้งหมด →
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mb-3 h-9 animate-pulse rounded-lg bg-slate-100 last:mb-0" />
            ))}
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FilePlus size={20} />
            </div>
            <p className="font-medium text-slate-600">ยังไม่มีเอกสารในระบบ</p>
            <p className="mt-1 text-xs text-slate-400">เริ่มสร้างเอกสารใบแรกได้เลย</p>
            <button
              onClick={() => navigate('/documents/quotations')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <FilePlus size={14} />
              สร้างเอกสาร
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-5 py-3 font-semibold text-slate-500">ชื่อลูกค้า</th>
                  <th className="px-5 py-3 font-semibold text-slate-500">ประเภท</th>
                  <th className="px-5 py-3 font-semibold text-slate-500">
                    <button
                      onClick={() => toggleSort('created_at')}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      วันที่
                      <SortIcon col="created_at" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-500">
                    <button
                      onClick={() => toggleSort('total_amount')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 ml-auto"
                    >
                      ยอดรวม
                      <SortIcon col="total_amount" sortCol={sortCol} sortDir={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-500">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/editor/${doc.id}`)}
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-slate-700">{getCustomerName(doc.content)}</td>
                    <td className="px-5 py-3 text-slate-500">{DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}</td>
                    <td className="px-5 py-3 text-slate-400">{fmtDate(doc.created_at)}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">฿{fmtAmount(doc.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[doc.status]}`}>
                        {STATUS_LABEL[doc.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        <p className="mt-0.5 text-sm text-slate-400">ยินดีต้อนรับ, {displayName}</p>
      </div>

      {/* Bento Grid */}
      <BentoGrid
        layout={layout}
        onLayoutChange={updateLayout}
        data={dashData}
      />
    </div>
  )
}
