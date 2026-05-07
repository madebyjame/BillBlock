import React from 'react'
import { Crown } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

const MEDALS = [
  { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '🥇' },
  { bg: 'bg-slate-100',  text: 'text-slate-500',  label: '🥈' },
  { bg: 'bg-orange-100', text: 'text-orange-500', label: '🥉' },
]

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0 })
}

interface Props {
  data: Pick<DashboardData, 'topSpenders' | 'loading'>
}

export default function TopSpendersWidget({ data }: Props) {
  const now = new Date()
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long' })

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50">
          <Crown size={13} className="text-yellow-500" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ลูกค้าชั้นดี</p>
      </div>
      <p className="mb-3 text-[11px] text-slate-400">ยอดสูงสุดเดือน{monthLabel}</p>

      {data.loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : data.topSpenders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Crown size={28} className="mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
          <p className="mt-0.5 text-xs text-slate-400">ยังไม่มีการชำระเงินเดือนนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.topSpenders.map((s, idx) => {
            const medal = MEDALS[idx] ?? MEDALS[2]
            return (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className="text-lg leading-none">{medal.label}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{s.name}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold ${medal.text}`}>
                  ฿{fmtAmount(s.total)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
