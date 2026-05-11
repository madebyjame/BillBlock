import { BarChart2 } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: Pick<DashboardData, 'salesForecast' | 'loading'>
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function SalesForecastWidget({ data }: Props) {
  const entries = data.salesForecast

  const maxVal = entries.reduce((m, e) => {
    const v = e.actual ?? e.forecast ?? 0
    return Math.max(m, v)
  }, 1)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50">
          <BarChart2 size={13} className="text-indigo-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Sales Forecast</p>
      </div>

      {data.loading ? (
        <div className="flex flex-1 items-end gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex-1 animate-pulse rounded-t-md bg-slate-100" style={{ height: `${30 + i * 8}%` }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BarChart2 size={28} className="mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <>
          <div className="flex flex-1 items-end gap-1.5">
            {entries.map(entry => {
              const value   = entry.actual ?? entry.forecast ?? 0
              const isFcast = entry.actual === null
              const heightPct = maxVal > 0 ? Math.max((value / maxVal) * 100, 4) : 4

              return (
                <div key={entry.month_label} className="group flex flex-1 flex-col items-center gap-1">
                  {/* Value label */}
                  <span className="text-[9px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmtK(value)}
                  </span>
                  {/* Bar */}
                  <div className="w-full" style={{ height: `${heightPct}%` }}>
                    <div
                      className={`h-full w-full rounded-t-md transition-all ${
                        isFcast
                          ? 'border-2 border-dashed border-blue-400 bg-blue-50'
                          : 'bg-blue-400'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Month labels */}
          <div className="mt-1.5 flex gap-1.5">
            {entries.map(entry => (
              <div key={entry.month_label} className="flex-1 text-center">
                <span className={`text-[9px] font-medium ${entry.actual === null ? 'text-blue-400' : 'text-slate-400'}`}>
                  {entry.month_label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[10px] text-slate-400 text-right">
            คาดการณ์จาก 3-month moving average
          </p>
        </>
      )}
    </div>
  )
}
