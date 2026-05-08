import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import BentoGrid from '../components/BentoGrid'
import type { DashboardData, DashboardDoc, ProductAlert, SpenderEntry } from '../types/dashboard'

const LOW_STOCK_THRESHOLD = 10

function getCustomerName(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'customer' in content) {
    const c = (content as { customer?: { name?: unknown } }).customer
    if (c && typeof c.name === 'string' && c.name.trim()) return c.name
  }
  return '—'
}

export default function DashboardPage() {
  const { user } = useAuth()

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  const { layout, updateLayout } = useDashboardLayout()

  const [dashData, setDashData] = useState<DashboardData>({
    loading: true,
    revenue30d: 0,
    pendingAmount: 0,
    pendingCount: 0,
    sparkline: [],
    pendingDocs: [],
    recentDocs: [],
    lowStockProducts: [],
    topSpenders: [],
    customerCount: 0,
    companyName: '',
    themeColor,
  })

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setDashData(prev => ({ ...prev, loading: true }))
    try {
      const [docsRes, productsRes, countRes, profileRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, doc_type, status, total_amount, created_at, content')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, stock, unit')
          .lt('stock', LOW_STOCK_THRESHOLD)
          .order('stock', { ascending: true }),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('company_name')
          .maybeSingle(),
      ])

      const docs: DashboardDoc[] = (docsRes.data ?? []).map((r: Record<string, unknown>) => {
        const c = r.content as { docMeta?: { number?: string } } | null
        return { ...r, doc_number: c?.docMeta?.number ?? undefined } as DashboardDoc
      })
      const now = new Date()

      const company =
        typeof profileRes.data?.company_name === 'string' && profileRes.data.company_name.trim()
          ? profileRes.data.company_name : ''

      const cutoff30d = new Date(now.getTime() - 30 * 86_400_000).toISOString()
      const revenue30d = docs
        .filter(d => d.doc_type === 'invoice' && d.status === 'paid' && d.created_at >= cutoff30d)
        .reduce((s, d) => s + d.total_amount, 0)

      const sparklineDays = 14
      const sparklineMap = new Map<string, number>()
      for (let i = sparklineDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        sparklineMap.set(d.toISOString().slice(0, 10), 0)
      }
      for (const doc of docs) {
        if (doc.doc_type !== 'invoice' || doc.status !== 'paid') continue
        const key = doc.created_at.slice(0, 10)
        if (sparklineMap.has(key)) sparklineMap.set(key, (sparklineMap.get(key) ?? 0) + doc.total_amount)
      }
      const sparkline = [...sparklineMap.entries()].map(([key, value]) => ({
        label: new Date(key).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        value,
      }))

      const pendingDocs = docs.filter(d => d.doc_type === 'invoice' && d.status === 'sent')

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const spenderMap = new Map<string, number>()
      for (const doc of docs) {
        if (doc.doc_type !== 'invoice' || doc.status !== 'paid') continue
        if (doc.created_at < monthStart) continue
        const name = getCustomerName(doc.content)
        spenderMap.set(name, (spenderMap.get(name) ?? 0) + doc.total_amount)
      }
      const topSpenders: SpenderEntry[] = [...spenderMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, total]) => ({ name, total }))

      const lowStockProducts: ProductAlert[] = (productsRes.data ?? []) as ProductAlert[]

      setDashData({
        loading: false,
        revenue30d,
        pendingAmount: pendingDocs.reduce((s, d) => s + d.total_amount, 0),
        pendingCount: pendingDocs.length,
        sparkline,
        pendingDocs,
        recentDocs: docs.slice(0, 20),
        lowStockProducts,
        topSpenders,
        customerCount: countRes.count ?? 0,
        companyName: company,
        themeColor,
      })
    } catch {
      setDashData(prev => ({ ...prev, loading: false }))
    }
  }

  const displayName = dashData.companyName || user?.email?.split('@')[0] || 'ผู้ใช้งาน'

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">ยินดีต้อนรับ, {displayName}</p>
      </div>
      <BentoGrid layout={layout} onLayoutChange={updateLayout} data={dashData} />
    </div>
  )
}
