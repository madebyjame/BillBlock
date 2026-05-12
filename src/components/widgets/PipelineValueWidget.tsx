import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function PipelineValueWidget() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('documents')
        .select('total_amount')
        .eq('user_id', user!.id)
        .eq('doc_type', 'quotation')
        .eq('status', 'sent')
      const rows = data ?? []
      setTotal(rows.reduce((s, r) => s + r.total_amount, 0))
      setCount(rows.length)
      setLoading(false)
    }
  }, [user])

  return (
    <div className="flex h-full flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">มูลค่า Pipeline</p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-slate-800">{fmtThb(total)}</p>
          <p className="text-xs text-slate-400">ใบเสนอราคาที่รอปิดการขาย {count} ฉบับ</p>
          {count > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] text-amber-600 font-medium">รอการตอบรับ</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
