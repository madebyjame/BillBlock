import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Mail, MapPin, Phone, Tag, TrendingUp, User, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { getCustomerById, type CustomerRow } from '../lib/customerApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerDoc {
  id: string
  doc_type: string
  status: string
  total_amount: number
  created_at: string
  doc_number: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation:      'ใบเสนอราคา',
  invoice:        'ใบแจ้งหนี้',
  receipt:        'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice':  'ใบกำกับภาษี',
  'credit-note':  'ใบลดหนี้',
}

const DOC_STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'ร่าง',       cls: 'bg-slate-100 text-slate-500' },
  sent:      { label: 'ส่งแล้ว',    cls: 'bg-blue-100 text-blue-600' },
  pending:   { label: 'รอชำระ',     cls: 'bg-amber-100 text-amber-700' },
  overdue:   { label: 'เกินกำหนด', cls: 'bg-red-100 text-red-600' },
  paid:      { label: 'ชำระแล้ว',   cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก',     cls: 'bg-slate-100 text-slate-400' },
}

const GRADE_META: Record<string, { grade: string; label: string; cls: string }> = {
  vip:      { grade: 'A', label: 'VIP', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  active:   { grade: 'B', label: 'ปกติ', cls: 'bg-green-100 text-green-700 border border-green-200' },
  inactive: { grade: 'C', label: 'เฉื่อย', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  blocked:  { grade: 'F', label: 'ระงับ', cls: 'bg-red-100 text-red-600 border border-red-200' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
}

/** Deterministic pastel from name */
function avatarStyle(name: string): { bg: string; color: string } {
  const hue = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 360
  return { bg: `hsl(${hue},38%,88%)`, color: `hsl(${hue},40%,40%)` }
}

// ─── Revenue Sparkline Chart ──────────────────────────────────────────────────

function RevenueSparkline({ data }: { data: { label: string; revenue: number }[] }) {
  if (data.every(d => d.revenue === 0)) {
    return (
      <div className="flex h-20 items-center justify-center text-xs text-slate-400">
        ยังไม่มีข้อมูลยอดขาย
      </div>
    )
  }
  const W = 600; const H = 72
  const PAD = { t: 6, b: 22, l: 4, r: 4 }
  const n      = data.length
  const maxRev = Math.max(...data.map(d => d.revenue), 1)

  const pts = data.map((d, i) => ({
    x: PAD.l + (n === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (n - 1)) * (W - PAD.l - PAD.r)),
    y: PAD.t + (1 - d.revenue / maxRev) * (H - PAD.t - PAD.b),
    ...d,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="cxGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#cxGrad)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <title>{p.label}: ฿{fmtAmount(p.revenue)}</title>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#6366f1" stroke="white" strokeWidth={1.5} />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94a3b8">{p.label}</text>
          {p.revenue > 0 && (
            <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="600">
              {p.revenue >= 1000 ? `${(p.revenue / 1000).toFixed(0)}k` : p.revenue}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── Widget Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-800 tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CustomerRow | null>(null)
  const [docs, setDocs]         = useState<CustomerDoc[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    void load(id)
  }, [id])

  async function load(customerId: string) {
    setLoading(true)
    try {
      const cx = await getCustomerById(customerId)
      if (!cx) { navigate('/customers'); return }
      setCustomer(cx)

      // Load all docs, filter client-side by customer name (same pattern as existing modal)
      const { data } = await supabase
        .from('documents')
        .select('id, doc_type, status, total_amount, created_at, content')
        .order('created_at', { ascending: false })

      const matched: CustomerDoc[] = (data ?? [])
        .filter((d: Record<string, unknown>) => {
          const c = d.content as { customer?: { name?: string } } | null
          return c?.customer?.name?.trim() === cx.name.trim()
        })
        .map((d: Record<string, unknown>) => {
          const c = d.content as { docMeta?: { number?: string } } | null
          return {
            id:           d.id as string,
            doc_type:     d.doc_type as string,
            status:       d.status as string,
            total_amount: d.total_amount as number,
            created_at:   d.created_at as string,
            doc_number:   c?.docMeta?.number ?? '',
          }
        })
      setDocs(matched)
    } catch {
      toast.error('โหลดข้อมูลลูกค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  // ─── Computed KPIs ───────────────────────────────────────────────────────────

  const totalSales = useMemo(
    () => docs
      .filter(d => ['receipt', 'tax-invoice'].includes(d.doc_type) && d.status === 'paid')
      .reduce((s, d) => s + d.total_amount, 0),
    [docs],
  )

  const arBalance = useMemo(
    () => docs
      .filter(d => ['invoice', 'billing-note', 'tax-invoice'].includes(d.doc_type) &&
        ['pending', 'overdue', 'sent'].includes(d.status))
      .reduce((s, d) => s + d.total_amount, 0),
    [docs],
  )

  const pendingCount = useMemo(
    () => docs.filter(d => ['draft', 'pending', 'sent', 'overdue'].includes(d.status)).length,
    [docs],
  )

  /** Revenue sparkline — 6 months from paid receipts/invoices */
  const sparklineData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d    = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('th-TH', { month: 'short' }).replace('.', '')
      const revenue = docs
        .filter(doc => {
          const isPaid = ['receipt', 'tax-invoice', 'invoice'].includes(doc.doc_type) && doc.status === 'paid'
          return isPaid && doc.created_at.slice(0, 7) === key
        })
        .reduce((s, doc) => s + doc.total_amount, 0)
      return { label, revenue }
    })
  }, [docs])

  const totalSparklineRevenue = sparklineData.reduce((s, d) => s + d.revenue, 0)

  // ─── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-4">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!customer) return null

  const grade   = GRADE_META[customer.status] ?? { grade: '?', label: '', cls: 'bg-slate-100 text-slate-400' }
  const avatarS = avatarStyle(customer.name)
  const initial = customer.name.trim().charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">

      {/* Back */}
      <button
        onClick={() => navigate('/customers')}
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ArrowLeft size={14} /> รายชื่อลูกค้า
      </button>

      {/* ── Section 1: Profile Card ── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />

        <div className="flex flex-wrap items-start gap-5 p-6">
          {/* Large Avatar */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm"
            style={{ backgroundColor: avatarS.bg, color: avatarS.color }}
          >
            {initial}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
              {/* Grade Badge */}
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${grade.cls}`}>
                {grade.grade}
              </span>
              {/* Status */}
              {customer.status === 'vip' && (
                <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">VIP</span>
              )}
            </div>

            {/* Info rows */}
            <div className="mt-2 grid grid-cols-1 gap-y-1.5 gap-x-6 text-sm sm:grid-cols-2">
              {customer.contact_person && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User size={12} className="shrink-0 text-slate-400" />
                  {customer.contact_person}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone size={12} className="shrink-0 text-slate-400" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Mail size={12} className="shrink-0 text-slate-400" />
                  {customer.email}
                </div>
              )}
              {customer.tax_id && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <FileText size={12} className="shrink-0 text-slate-400" />
                  เลขผู้เสียภาษี: <span className="font-mono">{customer.tax_id}</span>
                </div>
              )}
              {customer.credit_term && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Wallet size={12} className="shrink-0 text-slate-400" />
                  เครดิต: <span className="font-medium text-slate-700">{customer.credit_term}</span>
                </div>
              )}
              {customer.salesperson && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User size={12} className="shrink-0 text-slate-400" />
                  เซลส์: {customer.salesperson}
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-1.5 text-slate-500 sm:col-span-2">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{customer.address}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {customer.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Tag size={12} className="text-slate-400" />
                {customer.tags.map(t => (
                  <span key={t} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: KPI Cards ── */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="ยอดขายสะสม"
          value={`฿${fmtAmount(totalSales)}`}
          sub={`${docs.filter(d => ['receipt', 'tax-invoice'].includes(d.doc_type) && d.status === 'paid').length} เอกสาร`}
          icon={<TrendingUp size={20} className={totalSales > 0 ? 'text-green-600' : 'text-slate-400'} />}
          color={totalSales > 0 ? 'bg-green-50' : 'bg-slate-50'}
        />
        <KpiCard
          label="ยอดค้างชำระ (AR)"
          value={arBalance > 0 ? `฿${fmtAmount(arBalance)}` : '—'}
          sub={arBalance > 0 ? 'รอการชำระเงิน' : 'ไม่มียอดค้างชำระ'}
          icon={<Wallet size={20} className={arBalance > 0 ? 'text-red-500' : 'text-slate-400'} />}
          color={arBalance > 0 ? 'bg-red-50' : 'bg-slate-50'}
        />
        <KpiCard
          label="เอกสารรอดำเนินการ"
          value={String(pendingCount)}
          sub={pendingCount > 0 ? 'รายการ' : 'ไม่มีเอกสารค้างอยู่'}
          icon={<FileText size={20} className={pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'} />}
          color={pendingCount > 0 ? 'bg-amber-50' : 'bg-slate-50'}
        />
      </div>

      {/* ── Revenue Sparkline ── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 pt-4 pb-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">ยอดขาย 6 เดือนล่าสุด</h3>
          {totalSparklineRevenue > 0 && (
            <span className="text-xs text-slate-400">
              รวม <span className="font-semibold text-slate-600">฿{fmtAmount(totalSparklineRevenue)}</span>
            </span>
          )}
        </div>
        <RevenueSparkline data={sparklineData} />

        {/* Monthly mini breakdown */}
        <div className="mt-3 grid grid-cols-6 gap-1">
          {sparklineData.map((d, i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-2 text-center">
              <p className="text-[10px] text-slate-400">{d.label}</p>
              <p className="text-xs font-semibold text-slate-700">
                {d.revenue > 0 ? (d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue) : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Document History Table ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700">ประวัติเอกสารทั้งหมด</h3>
          <span className="text-xs text-slate-400">{docs.length} รายการ</span>
        </div>

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <FileText size={28} className="mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">ยังไม่พบเอกสารของลูกค้านี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold whitespace-nowrap">วันที่</th>
                  <th className="px-5 py-3 font-semibold">เลขที่เอกสาร</th>
                  <th className="px-5 py-3 font-semibold">ประเภท</th>
                  <th className="px-5 py-3 text-right font-semibold">ยอดรวม</th>
                  <th className="px-5 py-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => {
                  const statusMeta = DOC_STATUS_META[doc.status] ?? { label: doc.status, cls: 'bg-slate-100 text-slate-500' }
                  return (
                    <tr key={doc.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {fmtDate(doc.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        {doc.doc_number
                          ? <span className="font-mono text-xs font-semibold text-blue-600">{doc.doc_number}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">
                        ฿{fmtAmount(doc.total_amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
