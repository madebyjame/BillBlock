import type { CashFlowData } from '../lib/cashFlowEngine'

interface Props {
  data: CashFlowData
  loading?: boolean
}

function fmtAmount(n: number) {
  if (n === 0) return '฿0'
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${Math.round(n / 1_000)}k`
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtFull(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CashFlowForecast({ data, loading }: Props) {
  const maxAmount = Math.max(...data.buckets.map(b => b.amount), 1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Cash Flow Forecast</h2>
          <p className="text-xs text-slate-400 mt-0.5">ยอดที่คาดว่าจะได้รับจากใบแจ้งหนี้ที่ยังค้างอยู่</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">รวมที่คาดหวัง</p>
          {loading ? (
            <div className="mt-0.5 h-6 w-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-0.5 text-lg font-bold text-slate-800">฿{fmtFull(data.totalExpected)}</p>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : data.totalExpected === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">ไม่มียอดค้างชำระ</p>
          <p className="mt-1 text-xs text-slate-400">ใบแจ้งหนี้ทั้งหมดชำระแล้ว</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.buckets.map(bucket => {
            const pct = maxAmount > 0 ? (bucket.amount / maxAmount) * 100 : 0
            return (
              <div key={bucket.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="font-medium text-slate-700">{bucket.label}</span>
                    {bucket.count > 0 && (
                      <span className="text-slate-400">({bucket.count} ใบ)</span>
                    )}
                  </div>
                  <span className="font-semibold text-slate-700">
                    {bucket.amount > 0 ? fmtAmount(bucket.amount) : '—'}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: bucket.color, opacity: bucket.amount > 0 ? 1 : 0.2 }}
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
