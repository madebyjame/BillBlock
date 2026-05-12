import { useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function YtdSummaryWidget() {
  const { user } = useAuth()
  const [revenue, setRevenue]   = useState(0)
  const [docs, setDocs]         = useState(0)
  const [customers, setCustomers] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
      const [docsRes, custRes] = await Promise.all([
        supabase
          .from('documents')
          .select('total_amount, content')
          .eq('user_id', user!.id)
          .in('doc_type', ['invoice'])
          .in('status', ['sent', 'paid'])
          .gte('created_at', yearStart),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', yearStart),
      ])
      const rows = docsRes.data ?? []
      const custSet = new Set<string>()
      let rev = 0
      for (const r of rows) {
        rev += r.total_amount ?? 0
        const c = r.content as Record<string, unknown> | null
        const cust = c?.customer as Record<string, unknown> | null
        const id = cust?.id as string | undefined
        if (id) custSet.add(id)
      }
      setRevenue(rev)
      setDocs(rows.length)
      setCustomers(custRes.count ?? custSet.size)
      setLoading(false)
    }
  }, [user])

  const year = new Date().getFullYear()

  const items = [
    { label: 'รายได้รวม',     value: fmtThb(revenue), sub: 'จากใบแจ้งหนี้' },
    { label: 'เอกสาร',        value: String(docs),     sub: 'ใบแจ้งหนี้' },
    { label: 'ลูกค้าใหม่',   value: String(customers), sub: 'รายปีนี้' },
  ]

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <CalendarRange size={14} className="text-indigo-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ภาพรวมปี {year}</p>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3 flex-1 justify-center">
          {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 flex-1">
          {items.map(item => (
            <div key={item.label} className="flex flex-col gap-0.5 rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400">{item.label}</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">{item.value}</p>
              <p className="text-[9px] text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
