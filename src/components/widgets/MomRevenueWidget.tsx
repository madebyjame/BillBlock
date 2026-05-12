import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const REV_TYPES = new Set(['invoice', 'receipt', 'tax-invoice'])
function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function MomRevenueWidget() {
  const { user } = useAuth()
  const [thisMonth, setThisMonth] = useState(0)
  const [lastMonth, setLastMonth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const now = new Date()
      const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const lastEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

      const { data } = await supabase
        .from('documents')
        .select('total_amount, created_at, doc_type, status')
        .eq('user_id', user!.id)
        .eq('status', 'paid')
        .gte('created_at', lastStart)
      const rows = (data ?? []).filter(r => REV_TYPES.has(r.doc_type))
      setThisMonth(rows.filter(r => r.created_at >= thisStart).reduce((s, r) => s + r.total_amount, 0))
      setLastMonth(rows.filter(r => r.created_at >= lastStart && r.created_at <= lastEnd).reduce((s, r) => s + r.total_amount, 0))
      setLoading(false)
    }
  }, [user])

  const diff = thisMonth - lastMonth
  const pct  = lastMonth > 0 ? (diff / lastMonth) * 100 : null
  const up   = diff > 0
  const flat = diff === 0

  return (
    <div className="flex h-full flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เทียบเดือนที่แล้ว</p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-slate-800">{fmtThb(thisMonth)}</p>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${up ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {flat ? <Minus size={13} /> : up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {pct !== null
              ? `${up ? '+' : ''}${pct.toFixed(1)}% (${fmtThb(Math.abs(diff))})`
              : flat ? 'เท่าเดิม' : 'ไม่มีข้อมูลเดือนก่อน'
            }
          </div>
          <p className="text-[11px] text-slate-400">เดือนก่อน: {fmtThb(lastMonth)}</p>
        </div>
      )}
    </div>
  )
}
