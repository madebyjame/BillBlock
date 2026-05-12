import { useEffect, useState } from 'react'
import { PieChart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function RevConcentrationWidget() {
  const { user } = useAuth()
  const [topName, setTopName] = useState('')
  const [topAmt, setTopAmt] = useState(0)
  const [totalAmt, setTotalAmt] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
      const { data } = await supabase
        .from('documents')
        .select('total_amount, content')
        .eq('user_id', user!.id)
        .in('doc_type', ['invoice'])
        .in('status', ['sent', 'paid'])
        .gte('created_at', yearStart)
      const rows = data ?? []
      const map = new Map<string, { name: string; amount: number }>()
      let grand = 0
      for (const r of rows) {
        const c = r.content as Record<string, unknown> | null
        const cust = c?.customer as Record<string, unknown> | null
        const name = (cust?.name as string | undefined) ?? 'ไม่ระบุ'
        const amt = r.total_amount ?? 0
        grand += amt
        const cur = map.get(name) ?? { name, amount: 0 }
        map.set(name, { ...cur, amount: cur.amount + amt })
      }
      const sorted = [...map.values()].sort((a, b) => b.amount - a.amount)
      setTotalAmt(grand)
      setTopName(sorted[0]?.name ?? '')
      setTopAmt(sorted[0]?.amount ?? 0)
      setLoading(false)
    }
  }, [user])

  const pct = totalAmt > 0 ? Math.round((topAmt / totalAmt) * 100) : 0
  const risk = pct >= 50 ? 'ความเสี่ยงสูง' : pct >= 30 ? 'ความเสี่ยงปานกลาง' : 'ความเสี่ยงต่ำ'
  const riskColor = pct >= 50 ? 'text-rose-600' : pct >= 30 ? 'text-amber-600' : 'text-emerald-600'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <PieChart size={14} className="text-violet-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ความเสี่ยงลูกค้าเดียว (YTD)</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : totalAmt === 0 ? (
        <p className="text-xs text-slate-400 mt-2">ยังไม่มีข้อมูลปีนี้</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-bold text-slate-800">{pct}%</p>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${pct >= 50 ? 'bg-rose-400' : pct >= 30 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-slate-600 truncate">{topName}</p>
            <p className="text-[10px] text-slate-400">{fmtThb(topAmt)} จาก {fmtThb(totalAmt)}</p>
            <p className={`text-[11px] font-semibold ${riskColor}`}>{risk}</p>
          </div>
        </div>
      )}
    </div>
  )
}
