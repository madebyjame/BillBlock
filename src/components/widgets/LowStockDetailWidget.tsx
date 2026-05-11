import { AlertTriangle } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

const LOW_STOCK_THRESHOLD = 10

interface Props {
  data: Pick<DashboardData, 'lowStockProducts' | 'loading'>
}

type StockStatus = 'critical' | 'warning' | 'ok'

function stockStatus(stock: number): StockStatus {
  if (stock < 3) return 'critical'
  if (stock < 7) return 'warning'
  return 'ok'
}

function statusStyles(status: StockStatus): { badge: string; bar: string; label: string } {
  switch (status) {
    case 'critical': return { badge: 'bg-red-100 text-red-700',    bar: 'bg-red-500',    label: 'วิกฤต' }
    case 'warning':  return { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400',  label: 'ต่ำ' }
    case 'ok':       return { badge: 'bg-green-100 text-green-700', bar: 'bg-green-400',  label: 'ปกติ' }
  }
}

export default function LowStockDetailWidget({ data }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${data.lowStockProducts.length > 0 ? 'bg-red-50' : 'bg-slate-100'}`}>
          <AlertTriangle size={13} className={data.lowStockProducts.length > 0 ? 'text-red-500' : 'text-slate-400'} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Low Stock ละเอียด</p>
      </div>

      {data.loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : data.lowStockProducts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <AlertTriangle size={18} className="text-green-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">สต็อกปกติทุกรายการ</p>
          <p className="mt-0.5 text-xs text-slate-400">สินค้าเหลือมากกว่า {LOW_STOCK_THRESHOLD} ชิ้น</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {data.lowStockProducts.map(p => {
            const status = stockStatus(p.stock)
            const { badge, bar, label } = statusStyles(status)
            const pct = Math.min((p.stock / LOW_STOCK_THRESHOLD) * 100, 100)
            return (
              <div key={p.id} className="rounded-lg border border-slate-100 p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-700">{p.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {status === 'critical' && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        สั่งซื้อด่วน
                      </span>
                    )}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge}`}>
                      {label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {p.stock} {p.unit || 'ชิ้น'} / {LOW_STOCK_THRESHOLD}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
