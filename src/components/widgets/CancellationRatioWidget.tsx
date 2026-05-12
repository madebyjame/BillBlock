import { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function CancellationRatioWidget() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [cancelled, setCancelled] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data } = await supabase
        .from('documents')
        .select('status')
        .eq('user_id', user!.id)
        .gte('created_at', monthStart)
      const rows = data ?? []
      setTotal(rows.length)
      setCancelled(rows.filter(r => r.status === 'cancelled').length)
      setLoading(false)
    }
  }, [user])

  const rate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const color = rate === 0 ? 'text-emerald-600' : rate <= 10 ? 'text-amber-600' : 'text-rose-600'
  const bg    = rate === 0 ? 'bg-emerald-400' : rate <= 10 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <XCircle size={14} className="text-rose-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">อัตรายกเลิกเอกสาร</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className={`text-3xl font-bold ${color}`}>{rate}%</p>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${bg}`} style={{ width: `${Math.min(rate, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400">{cancelled} / {total} เอกสาร ถูกยกเลิกเดือนนี้</p>
          {rate === 0 && total > 0 && (
            <p className="text-[11px] text-emerald-600">ไม่มีการยกเลิกเลย 🎉</p>
          )}
          {total === 0 && (
            <p className="text-[11px] text-slate-400">ยังไม่มีเอกสารเดือนนี้</p>
          )}
        </div>
      )}
    </div>
  )
}
