import { useEffect, useState } from 'react'
import { UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface InactiveRow { name: string; lastSeen: string }

export default function InactiveCustomersWidget() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<InactiveRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString()
      // Get all customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name')
        .eq('user_id', user!.id)
      if (!customers?.length) { setLoading(false); return }

      // For each customer check last document
      const result: InactiveRow[] = []
      for (const c of customers) {
        const { data: docs } = await supabase
          .from('documents')
          .select('created_at')
          .eq('user_id', user!.id)
          .contains('content', { customer: { id: c.id } })
          .order('created_at', { ascending: false })
          .limit(1)
        const last = docs?.[0]?.created_at
        if (!last || last < cutoff) {
          result.push({ name: c.name, lastSeen: last ?? '' })
        }
        if (result.length >= 5) break
      }
      setRows(result)
      setLoading(false)
    }
  }, [user])

  function daysSince(iso: string) {
    if (!iso) return 'ไม่เคยซื้อ'
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    return `${d} วันที่แล้ว`
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <UserX size={14} className="text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ลูกค้าที่หายไป (90+ วัน)</p>
      </div>
      {loading ? (
        <div className="flex-1 flex flex-col gap-2 justify-center">
          {[1, 2, 3].map(i => <div key={i} className="h-7 animate-pulse rounded bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ลูกค้าทุกคนยังคงซื้ออยู่ 🎉</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {rows.map((r, i) => (
            <button
              key={i}
              onClick={() => navigate('/customers')}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-left hover:bg-slate-100 transition-colors"
            >
              <p className="truncate text-xs font-medium text-slate-700 flex-1">{r.name}</p>
              <span className="ml-2 shrink-0 text-[10px] text-slate-400">{daysSince(r.lastSeen)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
