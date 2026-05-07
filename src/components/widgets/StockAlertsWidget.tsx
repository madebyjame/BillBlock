import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

const LOW_STOCK_THRESHOLD = 10

interface Props {
  data: Pick<DashboardData, 'lowStockProducts' | 'loading'>
}

function stockColor(stock: number) {
  if (stock === 0) return { badge: 'bg-red-100 text-red-600', bar: 'bg-red-500', label: 'หมดสต็อก' }
  if (stock <= 5) return { badge: 'bg-orange-100 text-orange-600', bar: 'bg-orange-400', label: 'ใกล้หมด' }
  return { badge: 'bg-amber-100 text-amber-600', bar: 'bg-amber-400', label: 'เหลือน้อย' }
}

export default function StockAlertsWidget({ data }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${data.lowStockProducts.length > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
            <Package size={13} className={data.lowStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-400'} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">แจ้งเตือนสต็อก</p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          จัดการ <ChevronRight size={13} />
        </button>
      </div>

      {data.loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : data.lowStockProducts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <Package size={18} className="text-green-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">สต็อกปกติทุกรายการ</p>
          <p className="mt-0.5 text-xs text-slate-400">สินค้าเหลือมากกว่า {LOW_STOCK_THRESHOLD} ชิ้น</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.lowStockProducts.slice(0, 4).map(p => {
            const { badge, bar, label } = stockColor(p.stock)
            const pct = Math.min((p.stock / LOW_STOCK_THRESHOLD) * 100, 100)
            return (
              <button key={p.id} onClick={() => navigate('/products')} className="w-full rounded-lg border border-slate-100 p-2.5 text-left transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-700">{p.name}</p>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge}`}>
                    {label}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">{p.stock} {p.unit || 'ชิ้น'}</span>
                </div>
              </button>
            )
          })}
          {data.lowStockProducts.length > 4 && (
            <button
              onClick={() => navigate('/products')}
              className="text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              +{data.lowStockProducts.length - 4} รายการอื่นๆ
            </button>
          )}
        </div>
      )}
    </div>
  )
}
