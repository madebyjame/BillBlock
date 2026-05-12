import { useEffect, useMemo, useState } from 'react'
import { FileText, FileSpreadsheet, Lock, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../hooks/usePlan'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawDoc {
  id: string
  doc_type: string
  status: string
  created_at: string
  content: unknown
}

interface VatRow {
  date: string
  docNumber: string
  docType: string
  customerName: string
  taxId: string
  subtotal: number     // ฐานภาษี
  vatAmount: number    // ภาษีมูลค่าเพิ่ม 7%
  total: number
}

interface MonthGroup {
  monthKey: string   // YYYY-MM
  monthLabel: string
  rows: VatRow[]
  subtotalSum: number
  vatSum: number
  totalSum: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

// เอกสารที่คิด output VAT (ภาษีขาย)
const VAT_DOC_TYPES = new Set(['invoice', 'receipt', 'tax-invoice', 'billing-note'])

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice:        'ใบแจ้งหนี้',
  receipt:        'ใบเสร็จรับเงิน',
  'tax-invoice':  'ใบกำกับภาษี',
  'billing-note': 'ใบวางบิล',
}

function safeNum(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function parseDoc(doc: RawDoc): VatRow | null {
  if (!VAT_DOC_TYPES.has(doc.doc_type)) return null
  if (doc.status === 'cancelled') return null

  const c = (doc.content ?? {}) as Record<string, unknown>
  const docMeta  = (c.docMeta  ?? {}) as Record<string, unknown>
  const customer = (c.customer ?? {}) as Record<string, unknown>
  const summary  = (c.summary  ?? {}) as Record<string, unknown>

  const vatAmount = safeNum(summary.vatAmount)
  if (vatAmount === 0) return null  // ไม่มี VAT → ข้าม

  return {
    date:         doc.created_at.slice(0, 10),
    docNumber:    String(docMeta.number ?? ''),
    docType:      DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type,
    customerName: String(customer.name ?? ''),
    taxId:        String(customer.taxId ?? ''),
    subtotal:     safeNum(summary.subtotal),
    vatAmount,
    total:        safeNum(summary.total),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VatReportPage() {
  const { user } = useAuth()
  const { isBusiness } = usePlan()
  const [docs, setDocs] = useState<RawDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => currentMonthKey() + '-01')
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date()
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    void loadDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo])

  async function loadDocs() {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, doc_type, status, created_at, content')
        .eq('user_id', user.id)
        .in('doc_type', [...VAT_DOC_TYPES])
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: true })
      if (error) throw error
      setDocs((data ?? []) as RawDoc[])
    } finally {
      setLoading(false)
    }
  }

  // Parse + group by month
  const groups = useMemo<MonthGroup[]>(() => {
    const parsed = docs.map(parseDoc).filter((r): r is VatRow => r !== null)
    const map = new Map<string, VatRow[]>()
    for (const row of parsed) {
      const key = row.date.slice(0, 7)
      const arr = map.get(key) ?? []
      arr.push(row)
      map.set(key, arr)
    }
    return [...map.entries()].map(([key, rows]) => ({
      monthKey: key,
      monthLabel: monthLabel(key),
      rows,
      subtotalSum: rows.reduce((s, r) => s + r.subtotal, 0),
      vatSum:      rows.reduce((s, r) => s + r.vatAmount, 0),
      totalSum:    rows.reduce((s, r) => s + r.total, 0),
    }))
  }, [docs])

  const grandSubtotal = groups.reduce((s, g) => s + g.subtotalSum, 0)
  const grandVat      = groups.reduce((s, g) => s + g.vatSum, 0)
  const grandTotal    = groups.reduce((s, g) => s + g.totalSum, 0)

  function exportExcel() {
    const allRows = groups.flatMap(g =>
      g.rows.map(r => ({
        วันที่: r.date,
        ประเภทเอกสาร: r.docType,
        เลขที่เอกสาร: r.docNumber,
        ชื่อลูกค้า: r.customerName,
        'เลขประจำตัวผู้เสียภาษี': r.taxId,
        'มูลค่าสินค้า/บริการ (฿)': r.subtotal,
        'ภาษีมูลค่าเพิ่ม 7% (฿)': r.vatAmount,
        'ยอดรวม (฿)': r.total,
      }))
    )

    if (allRows.length === 0) { toast.error('ไม่มีข้อมูล'); return }

    const ws = XLSX.utils.json_to_sheet(allRows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 18 },
      { wch: 20 }, { wch: 18 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'VAT Report (ภ.พ.30)')
    XLSX.writeFile(wb, `vat_report_${dateFrom}_${dateTo}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">รายงาน VAT (ภ.พ.30)</h1>
          <p className="mt-1.5 text-sm text-slate-400">ภาษีขาย (Output VAT) จากใบแจ้งหนี้ ใบเสร็จ และใบกำกับภาษี</p>
        </div>
        <button
          onClick={() => isBusiness ? exportExcel() : toast.error('ฟีเจอร์นี้ต้องการแผน Business')}
          title={isBusiness ? undefined : 'ต้องการแผน Business'}
          className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 ${!isBusiness ? 'opacity-60' : ''}`}
        >
          {isBusiness ? <FileSpreadsheet size={15} className="text-green-600" /> : <Lock size={15} className="text-slate-400" />}
          Export Excel
        </button>
      </div>

      {/* Notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700">
          รายงานนี้แสดงเฉพาะ <strong>ภาษีขาย (Output VAT)</strong> จากเอกสารที่มี VAT 7%
          ยังไม่รวมภาษีซื้อ (Input VAT) เพราะยังไม่มีระบบบันทึกค่าใช้จ่าย/ซื้อสินค้า
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-500">จาก</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-500">ถึง</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        {/* Quick month buttons */}
        {[-2, -1, 0].map(offset => {
          const d = new Date()
          d.setMonth(d.getMonth() + offset)
          const y = d.getFullYear()
          const m = d.getMonth()
          const key = `${y}-${String(m + 1).padStart(2, '0')}`
          const label = d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
          const lastDay = new Date(y, m + 1, 0).getDate()
          return (
            <button key={key}
              onClick={() => {
                setDateFrom(`${key}-01`)
                setDateTo(`${key}-${String(lastDay).padStart(2, '0')}`)
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'มูลค่าสินค้า/บริการ', value: grandSubtotal, color: 'text-slate-800' },
          { label: 'ภาษีมูลค่าเพิ่ม 7%', value: grandVat, color: 'text-blue-700' },
          { label: 'ยอดรวมทั้งสิ้น', value: grandTotal, color: 'text-slate-900' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>฿{fmtAmount(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Table per month */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <FileText size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ไม่พบเอกสารที่มี VAT ในช่วงเวลาที่เลือก</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.monthKey} className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Month header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-sm font-semibold text-slate-700">{group.monthLabel}</p>
                <div className="flex items-center gap-6 text-xs text-slate-500">
                  <span>ฐานภาษี <strong className="text-slate-700">฿{fmtAmount(group.subtotalSum)}</strong></span>
                  <span>VAT <strong className="text-blue-600">฿{fmtAmount(group.vatSum)}</strong></span>
                  <span>รวม <strong className="text-slate-800">฿{fmtAmount(group.totalSum)}</strong></span>
                </div>
              </div>

              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">วันที่</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">ประเภท</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">เลขที่</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">ชื่อลูกค้า</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">เลขผู้เสียภาษี</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">ฐานภาษี</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">VAT 7%</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 text-slate-500">{row.date}</td>
                      <td className="px-5 py-3.5 text-slate-500">{row.docType}</td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-blue-600">{row.docNumber}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{row.customerName || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{row.taxId || '—'}</td>
                      <td className="px-5 py-3.5 text-right text-slate-700">฿{fmtAmount(row.subtotal)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-blue-600">฿{fmtAmount(row.vatAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">฿{fmtAmount(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {/* Month subtotal */}
                <tfoot>
                  <tr className="border-t border-slate-100 bg-slate-50/40">
                    <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-slate-400">รวมเดือน {group.monthLabel}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-700">฿{fmtAmount(group.subtotalSum)}</td>
                    <td className="px-5 py-3 text-right font-bold text-blue-600">฿{fmtAmount(group.vatSum)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">฿{fmtAmount(group.totalSum)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
