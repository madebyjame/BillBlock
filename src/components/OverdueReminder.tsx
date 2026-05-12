import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { OverdueInvoice } from '../lib/reminderEngine'
import { buildReminderMessage } from '../lib/reminderEngine'

interface Props {
  invoices: OverdueInvoice[]
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OverdueReminder({ invoices }: Props) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (invoices.length === 0) return null

  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const dueSoonCount = invoices.filter(i => i.status === 'due_soon').length

  async function handleCopyReminder(invoice: OverdueInvoice) {
    const msg = buildReminderMessage(invoice)
    try {
      await navigator.clipboard.writeText(msg)
      setCopiedId(invoice.id)
      toast.success('คัดลอกข้อความแจ้งเตือนแล้ว')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('คัดลอกไม่สำเร็จ')
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-800">
            {overdueCount > 0 && `${overdueCount} ใบเกินกำหนดชำระ`}
            {overdueCount > 0 && dueSoonCount > 0 && ' · '}
            {dueSoonCount > 0 && `${dueSoonCount} ใบครบกำหนดเร็วๆ นี้`}
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            ยอดค้างรวม ฿{fmtAmount(invoices.reduce((s, i) => s + i.totalAmount, 0))}
          </p>
        </div>
        <svg
          className={`h-4 w-4 text-red-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Invoice List */}
      {expanded && (
        <div className="border-t border-red-200">
          {invoices.map((inv, idx) => (
            <div
              key={inv.id}
              className={`flex items-center gap-3 px-5 py-3 ${idx < invoices.length - 1 ? 'border-b border-red-100' : ''}`}
            >
              {/* Status badge */}
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                inv.status === 'overdue'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {inv.status === 'overdue'
                  ? `เกิน ${inv.daysOverdue} วัน`
                  : inv.daysOverdue === 0 ? 'ครบวันนี้' : `อีก ${inv.daysOverdue} วัน`
                }
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {inv.customerName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {inv.docNumber} · ครบ {fmtDate(inv.dueDate)} · ฿{fmtAmount(inv.totalAmount)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => void handleCopyReminder(inv)}
                  title="คัดลอกข้อความแจ้งเตือน"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {copiedId === inv.id ? '✓ คัดลอกแล้ว' : 'Copy reminder'}
                </button>
                <button
                  onClick={() => navigate(`/editor/${inv.id}`)}
                  title="เปิดเอกสาร"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  เปิด
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
