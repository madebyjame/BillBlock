import { useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(0)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

interface Band { label: string; amount: number; color: string }

export default function ExpectedCashInflowWidget() {
  const { user } = useAuth()
  const [bands, setBands] = useState<Band[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const in7   = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
      const in30  = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0]
      const in90  = new Date(Date.now() + 90 * 86_400_000).toISOString().split('T')[0]

      const { data } = await supabase
        .from('documents')
        .select('total_amount, due_date')
        .eq('user_id', user!.id)
        .eq('doc_type', 'invoice')
        .eq('status', 'sent')
        .gte('due_date', todayStr)
        .lte('due_date', in90)
      const rows = data ?? []

      let w7 = 0, w30 = 0, w90 = 0
      for (const r of rows) {
        const d = r.due_date ?? ''
        const amt = r.total_amount ?? 0
        if (d <= in7)  w7  += amt
        else if (d <= in30) w30 += amt
        else                w90 += amt
      }

      const sum = w7 + w30 + w90
      setTotal(sum)
      setBands([
        { label: '7 วัน',    amount: w7,  color: 'bg-emerald-400' },
        { label: '8–30 วัน', amount: w30, color: 'bg-blue-400' },
        { label: '31–90 วัน',amount: w90, color: 'bg-slate-300' },
      ])
      setLoading(false)
    }
  }, [user])

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <Banknote size={14} className="text-emerald-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">คาดการณ์เงินเข้า (90 วัน)</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-bold text-slate-800">{fmtThb(total)}</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {total > 0 && bands.map(b => (
              <div
                key={b.label}
                className={`${b.color} h-full`}
                style={{ width: `${(b.amount / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex gap-3">
            {bands.map(b => (
              <div key={b.label} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${b.color}`} />
                <span className="text-[10px] text-slate-400">{b.label}: {fmtThb(b.amount)}</span>
              </div>
            ))}
          </div>
          {total === 0 && (
            <p className="text-[11px] text-slate-400">ไม่มีใบแจ้งหนี้ที่รอรับชำระใน 90 วัน</p>
          )}
        </div>
      )}
    </div>
  )
}
