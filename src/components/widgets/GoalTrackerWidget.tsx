import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import type { DashboardData } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

function getGoalKey(userId: string): string {
  return `bb_monthly_goal_${userId}`
}

function loadGoal(userId: string): number | null {
  try {
    const raw = localStorage.getItem(getGoalKey(userId))
    if (!raw) return null
    const n = Number(raw)
    return isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function saveGoal(userId: string, goal: number) {
  try {
    localStorage.setItem(getGoalKey(userId), String(goal))
  } catch { /* ignore */ }
}

function removeGoal(userId: string) {
  try {
    localStorage.removeItem(getGoalKey(userId))
  } catch { /* ignore */ }
}

function formatThb(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function GoalTrackerWidget({ data }: Props) {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [goal, setGoal] = useState<number | null>(() => loadGoal(userId))
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const revenue = data.revenue30d

  function handleSave() {
    const n = parseFloat(inputVal.replace(/,/g, ''))
    if (!isFinite(n) || n <= 0) return
    saveGoal(userId, n)
    setGoal(n)
    setEditing(false)
    setInputVal('')
  }

  function handleEdit() {
    setInputVal(goal ? String(goal) : '')
    setEditing(true)
  }

  function handleClear() {
    removeGoal(userId)
    setGoal(null)
    setEditing(false)
  }

  if (!goal && !editing) {
    return (
      <div className="flex h-full flex-col justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เป้าหมายรายเดือน</p>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-400">ยังไม่ได้ตั้งเป้าหมาย</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="เป้าหมาย (บาท)"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              ตั้ง
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex h-full flex-col justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เป้าหมายรายเดือน</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              บันทึก
            </button>
          </div>
          <button onClick={() => setEditing(false)} className="text-[10px] text-slate-400 hover:text-slate-600 text-left">
            ยกเลิก
          </button>
        </div>
      </div>
    )
  }

  const pct = goal ? Math.min((revenue / goal) * 100, 100) : 0
  const pctLabel = pct.toFixed(0)
  const isAchieved = pct >= 100

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เป้าหมายรายเดือน</p>
        <div className="flex gap-2">
          <button onClick={handleEdit} className="text-[10px] text-blue-500 hover:underline">แก้ไข</button>
          <button onClick={handleClear} className="text-[10px] text-slate-400 hover:text-red-400">ล้าง</button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${isAchieved ? 'text-green-600' : 'text-slate-700'}`}>
            {pctLabel}%
          </span>
          {isAchieved && (
            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-600">ถึงเป้า!</span>
          )}
        </div>

        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isAchieved ? 'bg-green-400' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs text-slate-500">
          {formatThb(revenue)} / {formatThb(goal ?? 0)}
        </p>
      </div>
    </div>
  )
}
