import { useEffect, useState } from 'react'
import { Archive } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1)}K`
  return `฿${n.toLocaleString('th-TH')}`
}

export default function TotalStockValueWidget() {
  const { user } = useAuth()
  const [value, setValue] = useState(0)
  const [items, setItems] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('stock, cost_price')
        .eq('user_id', user!.id)
        .gt('stock', 0)
      const rows = data ?? []
      setValue(rows.reduce((s, r) => s + r.stock * (r.cost_price ?? 0), 0))
      setItems(rows.length)
      setLoading(false)
    }
  }, [user])

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <Archive size={14} className="text-indigo-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">มูลค่าสต็อกรวม</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-bold text-slate-800">{fmtThb(value)}</p>
          <p className="text-xs text-slate-400">{items} รายการที่มีสต็อก</p>
          {value === 0 && items > 0 && (
            <p className="text-[11px] text-amber-600">สินค้ามีสต็อก แต่ยังไม่ได้ใส่ราคาทุน</p>
          )}
        </div>
      )}
    </div>
  )
}
