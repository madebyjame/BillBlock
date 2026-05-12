import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AvgPaymentTimeWidget() {
  const { user } = useAuth()
  const [avgDays, setAvgDays] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      // Get paid invoices with both created_at and a paid payment
      const { data: docs } = await supabase
        .from('documents')
        .select('id, created_at')
        .eq('user_id', user!.id)
        .eq('doc_type', 'invoice')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(50)
      if (!docs?.length) { setLoading(false); return }

      const { data: payments } = await supabase
        .from('payments')
        .select('document_id, paid_at')
        .eq('user_id', user!.id)
        .in('document_id', docs.map(d => d.id))
      const payMap = new Map<string, string>()
      for (const p of payments ?? []) {
        if (p.document_id && !payMap.has(p.document_id)) payMap.set(p.document_id, p.paid_at)
      }

      const diffs: number[] = []
      for (const d of docs) {
        const paidAt = payMap.get(d.id)
        if (!paidAt) continue
        const diff = Math.round((new Date(paidAt).getTime() - new Date(d.created_at).getTime()) / 86_400_000)
        if (diff >= 0) diffs.push(diff)
      }

      if (diffs.length > 0) {
        setAvgDays(Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length))
        setCount(diffs.length)
      }
      setLoading(false)
    }
  }, [user])

  const color = avgDays === null ? 'text-slate-400' : avgDays <= 14 ? 'text-emerald-600' : avgDays <= 30 ? 'text-amber-600' : 'text-rose-600'
  const label = avgDays === null ? '—' : avgDays <= 14 ? 'เก็บเงินเร็ว' : avgDays <= 30 ? 'ปกติ' : 'ช้ากว่าเกณฑ์'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เวลาเก็บเงินเฉลี่ย (DSO)</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : avgDays === null ? (
        <p className="text-xs text-slate-400 mt-2">ยังไม่มีใบแจ้งหนี้ที่ชำระแล้ว</p>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-bold ${color}`}>{avgDays}</p>
            <p className="mb-1 text-sm text-slate-500">วัน</p>
          </div>
          <p className={`text-xs font-medium ${color}`}>{label}</p>
          <p className="text-xs text-slate-400">เฉลี่ยจาก {count} ใบแจ้งหนี้</p>
        </div>
      )}
    </div>
  )
}
