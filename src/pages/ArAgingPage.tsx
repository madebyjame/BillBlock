import { useEffect, useState } from 'react'
import { AlertTriangle, FileSpreadsheet, Lock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { usePlan } from '../hooks/usePlan'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgingRow {
  id: string
  doc_type: string
  doc_number: string
  customer_name: string
  total_amount: number
  due_date: string
  days_overdue: number
  bucket: '0-30' | '31-60' | '61-90' | '90+'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BUCKET_META = {
  '0-30':  { label: '≤ 30 วัน',   color: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-400' },
  '31-60': { label: '31-60 วัน',  color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' },
  '61-90': { label: '61-90 วัน',  color: 'bg-red-100 text-red-600',      bar: 'bg-red-400' },
  '90+':   { label: '> 90 วัน',   color: 'bg-red-200 text-red-800',      bar: 'bg-red-600' },
} as const

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice:       'ใบแจ้งหนี้',
  'billing-note': 'ใบวางบิล',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArAgingPage() {
  const [rows, setRows]       = useState<AgingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_ar_aging')
      if (error) throw error
      setRows((data ?? []).map((r: Record<string, unknown>) => ({
        id:            String(r.id),
        doc_type:      String(r.doc_type),
        doc_number:    String(r.doc_number ?? '-'),
        customer_name: String(r.customer_name ?? '-'),
        total_amount:  Number(r.total_amount),
        due_date:      String(r.due_date),
        days_overdue:  Number(r.days_overdue),
        bucket:        String(r.bucket) as AgingRow['bucket'],
      })))
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  // Summary by bucket
  const buckets = (['0-30', '31-60', '61-90', '90+'] as const).map(b => ({
    ...BUCKET_META[b],
    key: b,
    total: rows.filter(r => r.bucket === b).reduce((s, r) => s + r.total_amount, 0),
    count: rows.filter(r => r.bucket === b).length,
  }))

  const grandTotal = rows.reduce((s, r) => s + r.total_amount, 0)
  const { isBusiness } = usePlan()

  function exportExcel() {
    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }
    const data = rows.map(r => ({
      'เลขที่เอกสาร': r.doc_number,
      ประเภท: DOC_TYPE_LABEL[r.doc_type] ?? r.doc_type,
      ลูกค้า: r.customer_name,
      'ยอดคงค้าง (฿)': r.total_amount,
      'ครบกำหนด': fmtDate(r.due_date),
      'ค้างชำระ (วัน)': r.days_overdue,
      ช่วงอายุ: BUCKET_META[r.bucket].label,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'AR Aging')
    XLSX.writeFile(wb, `ar_aging_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">AR Aging — ลูกหนี้ค้างชำระ</h1>
          <p className="mt-1.5 text-sm text-slate-400">ใบแจ้งหนี้ / ใบวางบิล ที่ยังไม่ชำระ จัดกลุ่มตามอายุหนี้</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
          <button
            onClick={() => isBusiness ? exportExcel() : toast.error('ฟีเจอร์นี้ต้องการแผน Business')}
            title={isBusiness ? undefined : 'ต้องการแผน Business'}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 ${!isBusiness ? 'opacity-60' : ''}`}
          >
            {isBusiness ? <FileSpreadsheet size={15} className="text-green-600" /> : <Lock size={15} className="text-slate-400" />}
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* Grand total */}
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <p className="mb-2 text-xs font-medium text-slate-500">รวมทั้งหมด</p>
          <p className="text-2xl font-bold text-slate-800">฿{fmtAmount(grandTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{rows.length} รายการ</p>
        </div>
        {/* Per bucket */}
        {buckets.map(b => (
          <div key={b.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.color}`}>{b.label}</span>
              <span className="text-[10px] text-slate-400">{b.count} รายการ</span>
            </div>
            <p className="text-xl font-bold text-slate-700">฿{fmtAmount(b.total)}</p>
            {grandTotal > 0 && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${(b.total / grandTotal) * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <AlertTriangle size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ไม่มีลูกหนี้ค้างชำระ</p>
          <p className="mt-1 text-xs text-slate-300">เอกสารที่สถานะ "ส่งแล้ว" และมีวันครบกำหนดจะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                {['เลขที่', 'ประเภท', 'ลูกค้า', 'วันครบกำหนด', 'ค้างชำระ', 'ยอดคงค้าง', 'อายุหนี้'].map(h => (
                  <th key={h} className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${h === 'ยอดคงค้าง' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const meta = BUCKET_META[row.bucket]
                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-mono text-sm text-slate-700">{row.doc_number}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{DOC_TYPE_LABEL[row.doc_type] ?? row.doc_type}</td>
                    <td className="px-5 py-4 font-medium text-slate-700">{row.customer_name}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{fmtDate(row.due_date)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.days_overdue > 90 ? 'bg-red-200 text-red-800' :
                        row.days_overdue > 60 ? 'bg-red-100 text-red-600' :
                        row.days_overdue > 30 ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {row.days_overdue} วัน
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-600">฿{fmtAmount(row.total_amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={5} className="px-5 py-4 font-bold text-slate-700">รวมทั้งหมด</td>
                <td className="px-5 py-4 text-right text-lg font-bold text-red-700">฿{fmtAmount(grandTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
