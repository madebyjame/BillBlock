import { TrendingUp } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: Pick<DashboardData, 'grossProfit' | 'loading'>
}

function fmtTHB(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}k`
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`
}

function marginBadgeClass(pct: number): string {
  if (pct >= 30) return 'bg-green-100 text-green-700'
  if (pct >= 10) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

export default function GrossProfitWidget({ data }: Props) {
  const gp = data.grossProfit

  const rows: { label: string; value: number; className: string }[] = [
    { label: 'รายได้',      value: gp.revenue,      className: 'text-slate-700' },
    { label: 'ต้นทุน (COGS)', value: gp.cogs,       className: 'text-rose-600' },
    { label: 'กำไรขั้นต้น', value: gp.gross_profit, className: 'text-emerald-600 font-semibold' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
            <TrendingUp size={13} className="text-emerald-500" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">กำไรขั้นต้นเดือนนี้</p>
        </div>
        {!data.loading && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${marginBadgeClass(gp.gross_margin_pct)}`}>
            {gp.gross_margin_pct.toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mb-4 text-[11px] text-slate-400">{gp.month_label}</p>

      {data.loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
              <p className="text-xs text-slate-500">{row.label}</p>
              <p className={`text-sm ${row.className}`}>{fmtTHB(row.value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
