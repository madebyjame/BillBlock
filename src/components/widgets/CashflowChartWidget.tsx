import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

interface MonthBar { label: string; revenue: number; expenses: number }

export default function CashflowChartWidget() {
  const { user } = useAuth()
  const [bars, setBars] = useState<MonthBar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      // Build last 6 months
      const months: MonthBar[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        const label = d.toLocaleDateString('th-TH', { month: 'short' })
        months.push({ label, revenue: 0, expenses: 0 })
      }

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)

      const [incomeRes, expenseRes] = await Promise.all([
        supabase
          .from('documents')
          .select('total_amount, created_at')
          .eq('user_id', user!.id)
          .in('doc_type', ['invoice'])
          .in('status', ['sent', 'paid'])
          .gte('created_at', sixMonthsAgo.toISOString()),
        supabase
          .from('payments')
          .select('amount, paid_at')
          .eq('user_id', user!.id)
          .gte('paid_at', sixMonthsAgo.toISOString()),
      ])

      for (const r of incomeRes.data ?? []) {
        const m = new Date(r.created_at).getMonth()
        const y = new Date(r.created_at).getFullYear()
        const idx = months.findIndex((_, i) => {
          const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
          return d.getMonth() === m && d.getFullYear() === y
        })
        if (idx >= 0) months[idx].revenue += r.total_amount ?? 0
      }

      // expenses = payments going out (wht_amount as proxy — real expense tracking TBD)
      // For now show payments received vs invoiced (inflow chart)
      for (const r of expenseRes.data ?? []) {
        const m = new Date(r.paid_at).getMonth()
        const y = new Date(r.paid_at).getFullYear()
        const idx = months.findIndex((_, i) => {
          const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
          return d.getMonth() === m && d.getFullYear() === y
        })
        if (idx >= 0) months[idx].expenses += r.amount ?? 0
      }

      setBars(months)
      setLoading(false)
    }
  }, [user])

  const maxVal = bars.reduce((m, b) => Math.max(m, b.revenue, b.expenses), 1)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">กระแสเงินสด 6 เดือน</p>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" />ใบแจ้งหนี้</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />รับแล้ว</span>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-1 items-end gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <div className="w-full animate-pulse rounded-t bg-slate-100" style={{ height: `${20 + i * 10}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-1 items-end gap-2">
            {bars.map(b => {
              const rH = maxVal > 0 ? Math.max((b.revenue / maxVal) * 100, 3) : 3
              const eH = maxVal > 0 ? Math.max((b.expenses / maxVal) * 100, 3) : 3
              return (
                <div key={b.label} className="group flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmtK(b.revenue)}
                  </span>
                  <div className="flex w-full gap-0.5 items-end" style={{ height: '100%' }}>
                    <div className="flex-1 rounded-t bg-blue-400" style={{ height: `${rH}%` }} />
                    <div className="flex-1 rounded-t bg-emerald-400" style={{ height: `${eH}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-2">
            {bars.map(b => (
              <div key={b.label} className="flex-1 text-center text-[9px] text-slate-400">{b.label}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
