import { ShoppingCart } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: Pick<DashboardData, 'topProducts' | 'loading'>
}

function fmtRevenue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0 })
}

export default function TopProductsWidget({ data }: Props) {
  const maxRevenue = data.topProducts.reduce((m, p) => Math.max(m, p.revenue), 1)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
          <ShoppingCart size={13} className="text-blue-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">สินค้าขายดี Top 5</p>
      </div>

      {data.loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : data.topProducts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ShoppingCart size={28} className="mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูลสินค้า</p>
          <p className="mt-0.5 text-xs text-slate-400">สร้างใบแจ้งหนี้เพื่อดูสถิติ</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.topProducts.map((product, idx) => {
            const pct = Math.round((product.revenue / maxRevenue) * 100)
            return (
              <div key={product.product_id} className="group">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 text-[11px] font-bold text-slate-400 w-4">
                      {idx + 1}.
                    </span>
                    <p className="truncate text-xs font-medium text-slate-700">{product.product_name}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                      {product.quantity_sold} ชิ้น
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ฿{fmtRevenue(product.revenue)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
