import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Lock, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../hooks/usePlan'
import { supabase } from '../lib/supabase'
import type { PaymentRow } from '../lib/paymentApi'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentWithDoc extends PaymentRow {
  doc_number: string
  customer_name: string
  customer_tax_id: string
  doc_type: string
}

interface WhtGroup {
  rate: number
  rows: PaymentWithDoc[]
  whtSum: number
  amountSum: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const WHT_FORM: Record<number, string> = {
  1: 'ภ.ง.ด.3 (บุคคลธรรมดา)',
  1.5: 'ภ.ง.ด.3 (บุคคลธรรมดา)',
  2: 'ภ.ง.ด.53 (นิติบุคคล)',
  3: 'ภ.ง.ด.53 (นิติบุคคล)',
  5: 'ภ.ง.ด.53 (นิติบุคคล)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WhtReportPage() {
  const { user } = useAuth()
  const { isBusiness } = usePlan()
  const [payments, setPayments] = useState<PaymentWithDoc[]>([])
  const [loading, setLoading] = useState(true)

  // Default: current month
  const now = new Date()
  const [dateFrom, setDateFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  )
  const [dateTo, setDateTo] = useState(() => {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    void loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo])

  async function loadPayments() {
    if (!user) return
    setLoading(true)
    try {
      // payments with wht_rate > 0 in date range
      const { data, error } = await supabase
        .from('payments')
        .select('*, documents(doc_type, content)')
        .eq('user_id', user.id)
        .gt('wht_rate', 0)
        .gte('paid_at', dateFrom)
        .lte('paid_at', dateTo)
        .order('paid_at', { ascending: true })

      if (error) throw error

      const rows: PaymentWithDoc[] = (data ?? []).map((p) => {
        const doc = (p as Record<string, unknown>).documents as Record<string, unknown> | null
        const content = (doc?.content ?? {}) as Record<string, unknown>
        const docMeta  = (content.docMeta  ?? {}) as Record<string, unknown>
        const customer = (content.customer ?? {}) as Record<string, unknown>
        return {
          id: p.id as string,
          document_id: p.document_id as string,
          amount: Number(p.amount),
          method: p.method as PaymentRow['method'],
          paid_at: p.paid_at as string,
          wht_rate: Number(p.wht_rate),
          wht_amount: Number(p.wht_amount),
          note: p.note as string,
          created_at: p.created_at as string,
          doc_type: doc?.doc_type as string ?? '',
          doc_number: String(docMeta.number ?? ''),
          customer_name: String(customer.name ?? ''),
          customer_tax_id: String(customer.taxId ?? ''),
        }
      })
      setPayments(rows)
    } finally {
      setLoading(false)
    }
  }

  // Group by WHT rate
  const groups = useMemo<WhtGroup[]>(() => {
    const map = new Map<number, PaymentWithDoc[]>()
    for (const p of payments) {
      const arr = map.get(p.wht_rate) ?? []
      arr.push(p)
      map.set(p.wht_rate, arr)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([rate, rows]) => ({
        rate,
        rows,
        whtSum:    rows.reduce((s, r) => s + r.wht_amount, 0),
        amountSum: rows.reduce((s, r) => s + r.amount, 0),
      }))
  }, [payments])

  const totalWht    = groups.reduce((s, g) => s + g.whtSum, 0)
  const totalAmount = groups.reduce((s, g) => s + g.amountSum, 0)

  function exportExcel() {
    const rows = payments.map(p => ({
      วันที่จ่าย: fmtDate(p.paid_at),
      เลขที่เอกสาร: p.doc_number,
      ชื่อผู้รับเงิน: p.customer_name,
      'เลขประจำตัวผู้เสียภาษี': p.customer_tax_id,
      'จำนวนเงินที่จ่าย (฿)': p.amount,
      'อัตรา WHT (%)': p.wht_rate,
      'ภาษีที่หัก (฿)': p.wht_amount,
      'ยอดสุทธิที่จ่าย (฿)': p.amount - p.wht_amount,
      แบบฟอร์ม: WHT_FORM[p.wht_rate] ?? `${p.wht_rate}%`,
      หมายเหตุ: p.note,
    }))

    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 12 }, { wch: 16 }, { wch: 26 }, { wch: 18 },
      { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 16 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'WHT Report')
    XLSX.writeFile(wb, `wht_report_${dateFrom}_${dateTo}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">รายงาน WHT (ภ.ง.ด.3/53)</h1>
          <p className="mt-1.5 text-sm text-slate-400">ภาษีหัก ณ ที่จ่าย — จากรายการชำระที่บันทึก WHT ไว้</p>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">รายการทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{payments.length} รายการ</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">ยอดที่จ่ายก่อนหัก</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">฿{fmtAmount(totalAmount)}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-medium text-amber-600">ภาษีที่หัก ณ ที่จ่าย รวม</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">฿{fmtAmount(totalWht)}</p>
        </div>
      </div>

      {/* Tables grouped by rate */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <Receipt size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ไม่พบรายการ WHT ในช่วงเวลาที่เลือก</p>
          <p className="mt-1 text-xs text-slate-300">บันทึก WHT ได้จากเมนูชำระเงินใน ใบแจ้งหนี้ / ใบวางบิล</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.rate} className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <div>
                  <span className="text-sm font-bold text-amber-700">WHT {group.rate}%</span>
                  <span className="ml-2 text-xs text-slate-400">{WHT_FORM[group.rate] ?? ''}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-500">
                  <span>{group.rows.length} รายการ</span>
                  <span>ยอดก่อนหัก <strong className="text-slate-700">฿{fmtAmount(group.amountSum)}</strong></span>
                  <span>ภาษีที่หัก <strong className="text-amber-700">฿{fmtAmount(group.whtSum)}</strong></span>
                </div>
              </div>

              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    {['วันที่', 'เลขที่เอกสาร', 'ชื่อผู้รับเงิน', 'เลขผู้เสียภาษี', 'จำนวนเงิน', 'ภาษีที่หัก', 'สุทธิ', 'หมายเหตุ'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 text-slate-500">{fmtDate(p.paid_at)}</td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-blue-600">{p.doc_number}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{p.customer_name || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.customer_tax_id || '—'}</td>
                      <td className="px-5 py-3.5 text-right text-slate-700">฿{fmtAmount(p.amount)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-amber-600">฿{fmtAmount(p.wht_amount)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">฿{fmtAmount(p.amount - p.wht_amount)}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
