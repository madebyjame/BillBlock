import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

function formatThb(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function TotalOutstandingWidget({ data }: Props) {
  const total = data.pendingAmount + data.overdueAmount

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">ยอดค้างชำระทั้งหมด</p>
        <p className="mt-2 text-3xl font-bold text-amber-700 leading-none">
          {data.loading ? '—' : formatThb(total)}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">รอชำระ</span>
          <span className="font-medium text-slate-700">
            {formatThb(data.pendingAmount)}
            <span className="ml-1 text-slate-400">({data.pendingCount} รายการ)</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-500">เกินกำหนด</span>
          <span className="font-medium text-red-600">
            {formatThb(data.overdueAmount)}
            <span className="ml-1 text-red-400">({data.overdueCount} รายการ)</span>
          </span>
        </div>
      </div>
    </div>
  )
}
