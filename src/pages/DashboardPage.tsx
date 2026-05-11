import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import BentoGrid from '../components/BentoGrid'
import type { DashboardData, DashboardDoc, ProductAlert, SpenderEntry, GradeEntry } from '../types/dashboard'

const LOW_STOCK_THRESHOLD = 10

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
    overdueAmount: 0,
    overdueCount: 0,
    overdueDocs: [],
    sparkline: [],
    pendingDocs: [],
    recentDocs: [],
    lowStockProducts: [],
    topSpenders: [],
    customerGrades: [],
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
      const userId = user!.id
      const [docsRes, productsRes, countRes, profileRes, gradesRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, doc_type, status, total_amount, created_at, due_date, content')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, stock, unit')
          .eq('user_id', userId)
          .lt('stock', LOW_STOCK_THRESHOLD)
          .order('stock', { ascending: true }),
        supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('company_name')
          .eq('id', userId)
          .maybeSingle(),
        supabase.rpc('get_customer_grades', { uid: userId }),
      ])

      const docs: DashboardDoc[] = (docsRes.data ?? []).map((r) => {
        const content = r.content as Record<string, unknown> | null
        const docMeta = content?.docMeta as Record<string, unknown> | null
        const customer = content?.customer as Record<string, unknown> | null
        return {
          ...r,
          due_date: typeof r.due_date === 'string' ? r.due_date : null,
          doc_number: typeof docMeta?.number === 'string' ? docMeta.number : undefined,
          customer_name: typeof customer?.name === 'string' ? customer.name : '—',
        } as DashboardDoc
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

      const todayStr = now.toISOString().split('T')[0]
      const overdueDocs = docs.filter(d =>
        d.doc_type === 'invoice' &&
        d.status === 'sent' &&
        d.due_date != null &&
        d.due_date < todayStr
      )
      const pendingDocs = docs.filter(d => d.doc_type === 'invoice' && d.status === 'sent')

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const spenderMap = new Map<string, number>()
      for (const doc of docs) {
        if (doc.doc_type !== 'invoice' || doc.status !== 'paid') continue
        if (doc.created_at < monthStart) continue
        const name = doc.customer_name ?? '—'
        spenderMap.set(name, (spenderMap.get(name) ?? 0) + doc.total_amount)
      }
      const topSpenders: SpenderEntry[] = [...spenderMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, total]) => ({ name, total }))

      const lowStockProducts: ProductAlert[] = (productsRes.data ?? []) as ProductAlert[]
      const customerGrades: GradeEntry[] = (gradesRes.data ?? []) as GradeEntry[]

      setDashData({
        loading: false,
        revenue30d,
        pendingAmount: pendingDocs.reduce((s, d) => s + d.total_amount, 0),
        pendingCount: pendingDocs.length,
        overdueAmount: overdueDocs.reduce((s, d) => s + d.total_amount, 0),
        overdueCount: overdueDocs.length,
        overdueDocs,
        sparkline,
        pendingDocs,
        recentDocs: docs.slice(0, 20),
        lowStockProducts,
        topSpenders,
        customerGrades,
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
    <div className="w-full p-6 md:p-8 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-400">ยินดีต้อนรับ, <span className="font-medium text-slate-600">{displayName}</span></p>
      </div>
      <BentoGrid layout={layout} onLayoutChange={updateLayout} data={dashData} />
    </div>
  )
}
