import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function NewCustomersWidget() {
  const { user } = useAuth()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { count: c } = await supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', startOfMonth)
        if (!cancelled) setCount(c ?? 0)
      } catch {
        if (!cancelled) setCount(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [user])

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">ลูกค้าใหม่เดือนนี้</p>
        <p className="mt-2 text-4xl font-bold text-green-700 leading-none">
          {loading ? '—' : (count ?? 0)}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {!loading && (count ?? 0) > 0 && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">
            +{count} ราย
          </span>
        )}
        <span className="text-[11px] text-slate-400">ลูกค้าใหม่ที่เพิ่มเดือนนี้</span>
      </div>
    </div>
  )
}
