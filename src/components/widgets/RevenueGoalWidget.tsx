import { useState } from 'react'
import { Target, Pencil, Check, X } from 'lucide-react'
import type { DashboardData } from '../../types/dashboard'

const GOAL_KEY = 'billblock_monthly_goal'

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('th-TH')
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return (
    <div className="flex h-16 items-center justify-center text-xs text-white/40">ยังไม่มีข้อมูล</div>
  )
  const W = 300
  const H = 56
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const n = data.length
  const totalGap = n + 1
  const barW = Math.max((W - totalGap * 2) / n, 4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * (H - 4), d.value > 0 ? 2 : 0)
        const x = 2 + i * (barW + 2)
        const y = H - barH
        const hasValue = d.value > 0
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={2}
              fill={hasValue ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.15)'} />
          </g>
        )
      })}
    </svg>
  )
}

function loadGoal(): number {
  try {
    const v = localStorage.getItem(GOAL_KEY)
    if (v) {
      const n = Number(v)
      if (!isNaN(n) && n > 0) return n
    }
  } catch { /* ignore */ }
  return 100_000
}

interface Props {
  data: Pick<DashboardData, 'revenue30d' | 'sparkline' | 'loading'>
}

export default function RevenueGoalWidget({ data }: Props) {
  const [goal, setGoal] = useState<number>(loadGoal)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const pct = goal > 0 ? Math.min((data.revenue30d / goal) * 100, 100) : 0
  const overGoal = data.revenue30d >= goal

  function startEdit() {
    setInputVal(String(goal))
    setEditing(true)
  }

  function saveGoal() {
    const n = Number(inputVal.replace(/,/g, ''))
    if (!isNaN(n) && n > 0) {
      setGoal(n)
      try { localStorage.setItem(GOAL_KEY, String(n)) } catch { /* ignore */ }
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
      <div className="mb-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">รายได้ 30 วันล่าสุด</p>
            {data.loading ? (
              <div className="mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
            ) : (
              <p className="mt-1 text-4xl font-bold tracking-tight">
                ฿{data.revenue30d.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${overGoal ? 'bg-yellow-400/20' : 'bg-white/15'}`}>
            <Target size={20} className={overGoal ? 'text-yellow-300' : 'text-white/70'} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mt-4">
          {data.loading
            ? <div className="h-16 animate-pulse rounded-lg bg-white/10" />
            : <BarChart data={data.sparkline} />
          }
        </div>
      </div>

      {/* Goal progress */}
      <div className="mt-5 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-blue-100">เป้าหมายรายเดือน</p>
          {!editing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-white">฿{fmtAmount(goal)}</span>
              <button
                onClick={startEdit}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded hover:bg-white/20 transition-colors"
                title="แก้ไขเป้าหมาย"
              >
                <Pencil size={11} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') cancelEdit() }}
                className="w-24 rounded px-2 py-0.5 text-xs text-slate-800 bg-white focus:outline-none"
                autoFocus
              />
              <button onClick={saveGoal} className="flex h-5 w-5 items-center justify-center rounded bg-white/20 hover:bg-white/30 transition-colors">
                <Check size={11} />
              </button>
              <button onClick={cancelEdit} className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/20 transition-colors">
                <X size={11} />
              </button>
            </div>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full rounded-full transition-all duration-700 ${overGoal ? 'bg-yellow-400' : 'bg-white'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[11px] text-blue-200">
          {overGoal
            ? `เกินเป้า +฿${fmtAmount(data.revenue30d - goal)}`
            : `เหลืออีก ฿${fmtAmount(goal - data.revenue30d)} (${(100 - pct).toFixed(0)}%)`
          }
        </p>
      </div>
    </div>
  )
}
