import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

interface RiskRow { customer_id: string; name: string; overdue: number }

export default function HighRiskCustomersWidget() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<RiskRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('documents')
        .select('total_amount, content, due_date')
        .eq('user_id', user!.id)
        .eq('doc_type', 'invoice')
        .eq('status', 'sent')
        .lt('due_date', cutoff)
      const raw = data ?? []
      const map = new Map<string, RiskRow>()
      for (const r of raw) {
        const c = r.content as Record<string, unknown> | null
        const cust = c?.customer as Record<string, unknown> | null
        const name = (cust?.name as string | undefined) ?? 'ไม่ระบุชื่อ'
        const id = (cust?.id as string | undefined) ?? name
        const cur = map.get(id) ?? { customer_id: id, name, overdue: 0 }
        map.set(id, { ...cur, overdue: cur.overdue + (r.total_amount ?? 0) })
      }
      setRows([...map.values()].sort((a, b) => b.overdue - a.overdue).slice(0, 5))
      setLoading(false)
    }
  }, [user])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <ShieldAlert size={14} className="text-rose-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ลูกค้าหนี้เสีย (90+ วัน)</p>
      </div>
      {loading ? (
        <div className="flex-1 flex flex-col gap-2 justify-center">
          {[1, 2].map(i => <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ไม่มีหนี้ค้างเกิน 90 วัน 🎉</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {rows.map(r => (
            <button
              key={r.customer_id}
              onClick={() => navigate('/customers')}
              className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-left hover:bg-rose-100 transition-colors"
            >
              <p className="truncate text-xs font-medium text-slate-700 flex-1">{r.name}</p>
              <span className="ml-2 shrink-0 text-xs font-bold text-rose-600">{fmtThb(r.overdue)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
