import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Box, ChevronRight, Package, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import {
  computeCommittedQtys, getProductById, getProductMonthlySales, type ProductRow,
} from '../lib/productApi'
import { listMovementsByProduct, recordStockMovement, type MovementType, type StockMovementRow } from '../lib/stockApi'

// ─── SVG Line Chart ────────────────────────────────────────────────────────────

function SalesLineChart({ data }: { data: { label: string; qty: number; revenue: number }[] }) {
  if (data.length === 0 || data.every(d => d.revenue === 0)) {
    return (
      <div className="flex h-20 items-center justify-center text-xs text-slate-400">
        ยังไม่มีข้อมูลการขาย
      </div>
    )
  }
  const W = 400; const H = 72
  const PAD = { t: 6, b: 22, l: 4, r: 4 }
  const n = data.length
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
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#salesGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
          <text x={p.x} y={H - 5} textAnchor="middle" fontSize="8" fill="#94a3b8">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Widget Card ───────────────────────────────────────────────────────────────

function Widget({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
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

// ─── Stock Card (movement log) ─────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; cls: string; sign: string }> = {
  IN:     { label: 'รับเข้า',  cls: 'bg-green-100 text-green-700', sign: '+' },
  OUT:    { label: 'ตัดออก',   cls: 'bg-red-100 text-red-600',     sign: '−' },
  ADJUST: { label: 'ปรับปรุง', cls: 'bg-blue-100 text-blue-600',   sign: '±' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [product, setProduct] = useState<ProductRow | null>(null)
  const [committed, setCommitted] = useState(0)
  const [movements, setMovements] = useState<StockMovementRow[]>([])
  const [salesData, setSalesData] = useState<{ label: string; qty: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  const [showQuickAdjust, setShowQuickAdjust] = useState(false)
  const [adjustType, setAdjustType] = useState<MovementType>('IN')
  const [adjustQty, setAdjustQty] = useState<number | ''>('')
  const [adjustNote, setAdjustNote] = useState('')
  const [adjustSaving, setAdjustSaving] = useState(false)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => {
    if (!id) return
    void load(id)
  }, [id])

  async function load(productId: string) {
    setLoading(true)
    try {
      const [prod, committedMap, mvs, sales] = await Promise.all([
        getProductById(productId),
        computeCommittedQtys(),
        listMovementsByProduct(productId),
        getProductMonthlySales(productId, 6),
      ])
      if (!prod) { navigate('/inventory/products'); return }
      setProduct(prod)
      setCommitted(committedMap.get(productId) ?? 0)
      setMovements(mvs)
      setSalesData(sales)
    } catch { toast.error('โหลดข้อมูลสินค้าไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  async function submitQuickAdjust() {
    if (!product || !adjustQty || adjustQty <= 0 || !adjustNote.trim()) return
    if (adjustType === 'OUT' && adjustQty > product.stock) {
      toast.error(`สต็อกไม่เพียงพอ (คงเหลือ ${product.stock})`); return
    }
    setAdjustSaving(true)
    try {
      await recordStockMovement({ product_id: product.id, movement_type: adjustType, quantity: adjustQty, note: adjustNote.trim() })
      toast.success('ปรับสต็อกสำเร็จ')
      setShowQuickAdjust(false)
      setAdjustQty(''); setAdjustNote('')
      void load(product.id)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ') }
    finally { setAdjustSaving(false) }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (!product) return null

  const available = product.stock - committed
  const stockValue = product.stock * product.cost_price
  const totalSalesQty = salesData.reduce((s, d) => s + d.qty, 0)
  const totalSalesRev = salesData.reduce((s, d) => s + d.revenue, 0)

  const adjustPreview = adjustQty !== '' && Number(adjustQty) > 0
    ? (adjustType === 'OUT' ? product.stock - Number(adjustQty) : product.stock + Number(adjustQty))
    : null

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      {/* Breadcrumb + Header */}
      <button onClick={() => navigate('/inventory/products')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
        <ArrowLeft size={14} /> รายการสินค้า
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
            {product.sku && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-500">{product.sku}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {product.category && <><span>{product.category}</span><ChevronRight size={10} /></>}
            <span>{product.unit}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {product.tax_type === 'vat_included' ? 'รวม VAT' : product.tax_type === 'vat_excluded' ? 'แยก VAT' : 'ยกเว้น VAT'}
            </span>
          </div>
        </div>
        <button onClick={() => setShowQuickAdjust(v => !v)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: themeColor }}>
          ปรับจำนวนสต็อกด่วน
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Widget label="คงเหลือ (On Hand)" value={product.stock.toLocaleString('th-TH')}
          sub={`min ${product.min_stock}`}
          icon={<Box size={18} className="text-slate-600" />} color="bg-slate-100" />
        <Widget label="จอง (Committed)" value={committed.toLocaleString('th-TH')}
          sub="จาก Invoice ที่ยังไม่ชำระ"
          icon={<Package size={18} className="text-amber-600" />} color="bg-amber-50" />
        <Widget label="พร้อมขาย (Available)"
          value={available.toLocaleString('th-TH')}
          sub={available < 0 ? '⚠ ติดลบ' : undefined}
          icon={<TrendingUp size={18} className={available < 0 ? 'text-red-600' : 'text-blue-600'} />}
          color={available < 0 ? 'bg-red-50' : 'bg-blue-50'} />
        <Widget label="มูลค่าสต็อก" value={`฿${fmtMoney(stockValue)}`}
          sub={`ต้นทุน ฿${product.cost_price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}/หน่วย`}
          icon={<Wallet size={18} className="text-green-600" />} color="bg-green-50" />
      </div>

      {/* Quick Adjust Panel */}
      {showQuickAdjust && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">ปรับจำนวนสต็อกด่วน</h3>
          <div className="mb-3 flex gap-2">
            {(['IN', 'OUT', 'ADJUST'] as MovementType[]).map(t => (
              <button key={t} onClick={() => setAdjustType(t)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                  adjustType === t
                    ? t === 'IN'  ? 'border-green-400 bg-green-50 text-green-700'
                    : t === 'OUT' ? 'border-red-400 bg-red-50 text-red-700'
                    :               'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {t === 'IN' ? 'รับเข้า' : t === 'OUT' ? 'ตัดออก' : 'ปรับ'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="จำนวน *">
              <input type="number" min={1} value={adjustQty}
                onChange={e => setAdjustQty(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls} placeholder="0" />
            </FormField>
            <FormField label="ยอดหลังปรับ">
              <div className={`flex h-[38px] items-center rounded-lg border px-3 text-sm font-semibold ${
                adjustPreview === null ? 'border-slate-200 text-slate-400'
                : adjustPreview < 0   ? 'border-red-300 bg-red-50 text-red-600'
                :                        'border-green-300 bg-green-50 text-green-700'
              }`}>
                {adjustPreview === null ? '—' : adjustPreview < 0 ? `ติดลบ (${adjustPreview})` : adjustPreview.toLocaleString('th-TH')}
              </div>
            </FormField>
            <FormField label="หมายเหตุ *">
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                placeholder="ระบุเหตุผล..." className={inputCls} />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowQuickAdjust(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">ยกเลิก</button>
            <button onClick={() => void submitQuickAdjust()} disabled={adjustSaving || !adjustQty || !adjustNote.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: themeColor }}>
              {adjustSaving ? 'บันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* Sales Chart */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">ยอดขาย 6 เดือนล่าสุด</h3>
          <div className="text-right text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{totalSalesQty.toLocaleString('th-TH')}</span> ชิ้น
            &nbsp;·&nbsp;
            <span className="font-semibold text-slate-600">฿{fmtMoney(totalSalesRev)}</span>
          </div>
        </div>
        <SalesLineChart data={salesData} />
        {/* Monthly breakdown */}
        <div className="mt-3 grid grid-cols-6 gap-1">
          {salesData.map((d, i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-2 text-center">
              <p className="text-[10px] text-slate-400">{d.label}</p>
              <p className="text-xs font-semibold text-slate-700">{d.qty}</p>
              <p className="text-[10px] text-slate-400">฿{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700">Stock Card — ประวัติการเคลื่อนไหว</h3>
          <span className="text-xs text-slate-400">{movements.length} รายการ</span>
        </div>
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Box size={28} className="mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">ยังไม่มีประวัติการเคลื่อนไหว</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ประเภท</th>
                  <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                  <th className="px-4 py-3 text-right font-medium">คงเหลือหลัง</th>
                  <th className="px-4 py-3 font-medium">อ้างอิงเอกสาร</th>
                  <th className="px-4 py-3 font-medium">หมายเหตุ</th>
                  <th className="px-4 py-3 font-medium">โดย</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m, idx) => {
                  const meta = TYPE_META[m.movement_type] ?? TYPE_META['ADJUST']
                  const isLast = idx === movements.length - 1
                  return (
                    <tr key={m.id} className={`border-t border-slate-50 hover:bg-slate-50/50 ${isLast ? '' : ''}`}>
                      <td className="px-4 py-2.5 text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(m.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${m.movement_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                        {meta.sign}{m.quantity.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-700 tabular-nums">
                        {m.balance_after.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{m.reference_document || '—'}</td>
                      <td className="px-4 py-2.5 max-w-[160px] text-slate-500">
                        <p className="truncate">{m.note || '—'}</p>
                      </td>
                      <td className="px-4 py-2.5 max-w-[120px] text-xs text-slate-400">
                        <p className="truncate">{m.created_by}</p>
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
