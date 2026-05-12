import type { DashboardData, TopProductEntry } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

export default function TopSellersQtyWidget({ data }: Props) {
  const sorted = [...data.topProducts]
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, 5)

  if (sorted.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">สินค้าขายดี (จำนวน)</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ยังไม่มีข้อมูลการขาย</p>
        </div>
      </div>
    )
  }

  const max = sorted[0]?.quantity_sold ?? 1

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สินค้าขายดี (จำนวน)</p>
      <div className="flex flex-col gap-2 flex-1">
        {sorted.map((item: TopProductEntry, idx: number) => {
          const pct = max > 0 ? (item.quantity_sold / max) * 100 : 0
          return (
            <div key={item.product_id} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-center text-[10px] font-bold text-slate-400">
                #{idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="truncate text-xs text-slate-700">{item.product_name}</p>
                  <span className="ml-1 shrink-0 text-[10px] text-slate-500">{item.quantity_sold} ชิ้น</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
