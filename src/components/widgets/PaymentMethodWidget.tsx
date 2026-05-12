import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const METHOD_LABEL: Record<string, string> = {
  cash:         'เงินสด',
  transfer:     'โอน',
  cheque:       'เช็ค',
  credit_card:  'บัตรเครดิต',
  other:        'อื่นๆ',
}

const METHOD_COLOR: Record<string, string> = {
  cash:         'bg-emerald-400',
  transfer:     'bg-blue-400',
  cheque:       'bg-amber-400',
  credit_card:  'bg-violet-400',
  other:        'bg-slate-300',
}

interface Row { method: string; count: number; total: number }

export default function PaymentMethodWidget() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
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
        .select('method, amount')
        .eq('user_id', user!.id)
        .gte('paid_at', monthStart)
      const raw = data ?? []
      const map = new Map<string, Row>()
      for (const r of raw) {
        const key = r.method ?? 'other'
        const cur = map.get(key) ?? { method: key, count: 0, total: 0 }
        map.set(key, { ...cur, count: cur.count + 1, total: cur.total + (r.amount ?? 0) })
      }
      setRows([...map.values()].sort((a, b) => b.total - a.total))
      setLoading(false)
    }
  }, [user])

  const grand = rows.reduce((s, r) => s + r.total, 0)

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <CreditCard size={14} className="text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ช่องทางชำระเงิน</p>
      </div>
      {loading ? (
        <div className="flex-1 flex flex-col gap-2 justify-center">
          {[1, 2, 3].map(i => <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ยังไม่มีการชำระเงินเดือนนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {rows.map(r => {
            const pct = grand > 0 ? (r.total / grand) * 100 : 0
            const color = METHOD_COLOR[r.method] ?? 'bg-slate-300'
            return (
              <div key={r.method} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{METHOD_LABEL[r.method] ?? r.method}</span>
                  <span className="text-slate-400">{r.count} ครั้ง · {pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
