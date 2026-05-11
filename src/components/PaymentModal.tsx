import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, CreditCard, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  listPayments,
  createPayment,
  deletePayment,
  PAYMENT_METHOD_LABEL,
  type PaymentRow,
  type PaymentMethod,
} from '../lib/paymentApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WHT_RATES = [0, 1, 1.5, 2, 3, 5] as const

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  documentId: string
  documentTotal: number     // ยอดรวมของเอกสาร
  documentTitle: string     // เช่น "INV-2025-001"
  onClose: () => void
  onPaymentChanged?: () => void  // callback เมื่อ payment เปลี่ยน (refetch parent)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentModal({ documentId, documentTotal, documentTitle, onClose, onPaymentChanged }: Props) {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [whtRate, setWhtRate] = useState(0)
  const [note, setNote] = useState('')

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, documentTotal - totalPaid)
  const pctPaid = documentTotal > 0 ? Math.min((totalPaid / documentTotal) * 100, 100) : 0
  const isFullyPaid = totalPaid >= documentTotal

  const whtAmount = whtRate > 0 ? Math.round(Number(amount) * whtRate) / 100 : 0
  const netReceive = Number(amount) - whtAmount

  async function loadPayments() {
    setLoading(true)
    try {
      const rows = await listPayments(documentId)
      setPayments(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId])

  // Keyboard: Escape to close
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  async function handleAdd() {
    if (!user || !amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await createPayment(user.id, {
        document_id: documentId,
        amount: Number(amount),
        method,
        paid_at: paidAt,
        wht_rate: whtRate,
        wht_amount: whtAmount,
        note,
      })
      setAmount('')
      setNote('')
      setWhtRate(0)
      await loadPayments()
      onPaymentChanged?.()
      toast.success('บันทึกการชำระเงินแล้ว')
    } catch {
      toast.error('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deletePayment(id)
      await loadPayments()
      onPaymentChanged?.()
      toast.success('ลบรายการแล้ว')
    } catch {
      toast.error('ลบไม่สำเร็จ')
    } finally {
      setDeleting(null)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl shadow-slate-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <CreditCard size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">บันทึกการชำระเงิน</p>
              <p className="text-xs text-slate-400">{documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-slate-500">ชำระแล้ว <span className="font-semibold text-slate-700">฿{fmtAmount(totalPaid)}</span></span>
              <span className={remaining > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-semibold'}>
                {remaining > 0 ? `คงเหลือ ฿${fmtAmount(remaining)}` : '✓ ชำระครบแล้ว'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${pctPaid}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">ยอดรวม ฿{fmtAmount(documentTotal)}</p>
          </div>

          {/* Payment history */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : payments.length > 0 ? (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5 last:border-0 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="shrink-0 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">฿{fmtAmount(p.amount)}</p>
                      <p className="text-[11px] text-slate-400">
                        {fmtDate(p.paid_at)} · {PAYMENT_METHOD_LABEL[p.method]}
                        {p.wht_rate > 0 && ` · WHT ${p.wht_rate}% (฿${fmtAmount(p.wht_amount)})`}
                        {p.note ? ` · ${p.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-2">ยังไม่มีรายการชำระ</p>
          )}

          {/* Add payment form */}
          {!isFullyPaid && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">เพิ่มรายการชำระ</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">จำนวนเงิน (฿)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder={`สูงสุด ${fmtAmount(remaining)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">วันที่รับชำระ</label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">วิธีชำระ</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  >
                    {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                    ))}
                  </select>
                </div>

                {/* WHT */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">หัก ณ ที่จ่าย (%)</label>
                  <select
                    value={whtRate}
                    onChange={(e) => setWhtRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  >
                    {WHT_RATES.map((r) => (
                      <option key={r} value={r}>{r === 0 ? 'ไม่มี WHT' : `${r}%`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WHT summary */}
              {whtRate > 0 && Number(amount) > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>ยอดก่อนหัก</span><span>฿{fmtAmount(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>WHT {whtRate}%</span><span>-฿{fmtAmount(whtAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800 border-t border-amber-100 pt-1 mt-1">
                    <span>รับจริง</span><span>฿{fmtAmount(netReceive)}</span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น มัดจำงวดแรก"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>

              <button
                onClick={() => void handleAdd()}
                disabled={submitting || !amount || Number(amount) <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Plus size={15} />}
                บันทึกการชำระ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
