import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
  stock: number
}

function isProductRow(v: unknown): v is Product {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return typeof obj['id'] === 'string' && typeof obj['name'] === 'string'
}

export default function OutOfStockWidget() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('user_id', user!.id)
          .lte('stock', 0)
          .order('name', { ascending: true })
          .limit(10)

        if (!cancelled) {
          const rows = (data ?? []).filter(isProductRow)
          setProducts(rows)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สินค้าหมด</p>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สินค้าหมด</p>
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <CheckCircle size={24} className="text-green-400" />
          <p className="text-xs text-slate-400">ไม่มีสินค้าหมด</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สินค้าหมด</p>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
          {products.length} รายการ
        </span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {products.slice(0, 5).map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5"
          >
            <p className="truncate text-xs text-slate-700">{p.name}</p>
            <span className="ml-2 shrink-0 text-[10px] font-semibold text-red-500">สต็อก: 0</span>
          </div>
        ))}
      </div>
    </div>
  )
}
