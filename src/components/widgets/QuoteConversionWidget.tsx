import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function QuoteConversionWidget() {
  const { user } = useAuth()
  const [sent, setSent] = useState(0)
  const [converted, setConverted] = useState(0)
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
        .eq('doc_type', 'quotation')
        .gte('created_at', monthStart)
      const rows = data ?? []
      setSent(rows.length)
      setConverted(rows.filter(r => r.status === 'accepted' || r.status === 'paid').length)
      setLoading(false)
    }
  }, [user])

  const rate = sent > 0 ? Math.round((converted / sent) * 100) : 0
  const color = rate >= 50 ? 'text-emerald-600' : rate >= 25 ? 'text-amber-600' : 'text-rose-600'
  const bg    = rate >= 50 ? 'bg-emerald-500' : rate >= 25 ? 'bg-amber-400' : 'bg-rose-400'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-violet-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">อัตราปิดการขาย</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className={`text-3xl font-bold ${color}`}>{rate}%</p>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all ${bg}`}
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{converted} / {sent} ใบ ปิดได้เดือนนี้</p>
          {sent === 0 && (
            <p className="text-[11px] text-slate-400">ยังไม่มีใบเสนอราคาเดือนนี้</p>
          )}
        </div>
      )}
    </div>
  )
}
