import type { DashboardData, DashboardDoc } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'ไม่มีกำหนด'
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatThb(n: number): string {
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function PendingPaymentsWidget({ data }: Props) {
  const sorted = [...data.pendingDocs]
    .sort((a, b) => {
      // Nearest due date first; null due dates go last
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date < b.due_date ? -1 : 1
    })
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">รอเก็บเงิน</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ไม่มีรายการรอชำระ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">รอเก็บเงิน</p>
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {sorted.map((doc: DashboardDoc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-700">
                {doc.doc_number ?? '—'} · {doc.customer_name ?? '—'}
              </p>
              <p className="text-[10px] text-slate-400">
                ครบ {formatDate(doc.due_date)}
              </p>
            </div>
            <span className="ml-2 shrink-0 text-xs font-semibold text-slate-700">
              {formatThb(doc.total_amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
