import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

function formatThb(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function Revenue30dWidget({ data }: Props) {
  const rangeLabel = data.dateRange?.label ?? '30 วันล่าสุด'
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">รายได้ · {rangeLabel}</p>
        <p className="mt-2 text-3xl font-bold text-green-700 leading-none">
          {data.loading ? '—' : formatThb(data.revenue30d)}
        </p>
      </div>
      <p className="text-[11px] text-slate-400">จากใบเสร็จ / ใบแจ้งหนี้ / ใบกำกับภาษี ที่ชำระแล้ว</p>
    </div>
  )
}
