import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function WhtSummaryWidget() {
  const { user } = useAuth()
  const [whtTotal, setWhtTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data } = await supabase
        .from('payments')
        .select('wht_amount, wht_rate')
        .eq('user_id', user!.id)
        .gt('wht_rate', 0)
        .gte('paid_at', monthStart)
      const rows = data ?? []
      setWhtTotal(rows.reduce((s, r) => s + (r.wht_amount ?? 0), 0))
      setCount(rows.length)
      setLoading(false)
    }
  }, [user])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  return (
    <div className="flex h-full flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">WHT หัก ณ ที่จ่าย</p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-slate-800">{fmtThb(whtTotal)}</p>
          <p className="text-xs text-slate-400">{monthLabel} · {count} รายการ</p>
          {count === 0 && (
            <p className="text-[11px] text-slate-400">ยังไม่มีการหักภาษี ณ ที่จ่ายเดือนนี้</p>
          )}
        </div>
      )}
    </div>
  )
}
