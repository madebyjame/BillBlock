import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import { usePlan } from '../hooks/usePlan'
import {
  fetchTopProducts,
  fetchGrossProfitSummary,
  fetchSalesForecast,
} from '../lib/dashboardApi'
import BentoGrid from '../components/BentoGrid'
import OnboardingChecklist from '../components/OnboardingChecklist'
import DateRangePicker from '../components/DateRangePicker'
import {
  getDateRange,
  type DateRange,
  type DashboardData,
  type DashboardDoc,
  type ProductAlert,
  type SpenderEntry,
  type GradeEntry,
  type GrossProfitSummary,
} from '../types/dashboard'

const LOW_STOCK_THRESHOLD = 10

const INITIAL_DATE_RANGE = getDateRange('30d')

const EMPTY_GROSS_PROFIT: GrossProfitSummary = {
  revenue: 0,
  cogs: 0,
  gross_profit: 0,
  gross_margin_pct: 0,
  month_label: new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
}

// Doc types that count as "revenue when paid"
const REVENUE_DOC_TYPES = new Set(['invoice', 'receipt', 'tax-invoice'])

export default function DashboardPage() {
  const { user } = useAuth()
  const { plan } = usePlan()

  const themeColor =
    typeof user?.user_metadata?.themeColor === 'string'
      ? user.user_metadata.themeColor
      : '#1e3a8a'

  const userId = user!.id
  const { layout, updateLayout } = useDashboardLayout(userId)

  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE)

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
    topProducts: [],
    grossProfit: EMPTY_GROSS_PROFIT,
    salesForecast: [],
    dateRange: INITIAL_DATE_RANGE,
  })

  // ── Static data (loads once on mount) ────────────────────────────────────────
  const staticLoaded = useRef(false)

  useEffect(() => {
    if (staticLoaded.current) return
    staticLoaded.current = true
    void loadStaticData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadStaticData() {
    try {
      const [productsRes, countRes, profileRes, gradesRes, topProducts, grossProfit, salesForecast] =
        await Promise.all([
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
          fetchTopProducts(userId),
          fetchGrossProfitSummary(),
          fetchSalesForecast(),
        ])

      const company =
        typeof profileRes.data?.company_name === 'string' && profileRes.data.company_name.trim()
          ? profileRes.data.company_name
          : ''

      const lowStockProducts: ProductAlert[] = (productsRes.data ?? []) as ProductAlert[]
      const customerGrades: GradeEntry[] = (gradesRes.data ?? []) as GradeEntry[]

      setDashData(prev => ({
        ...prev,
        lowStockProducts,
        customerGrades,
        customerCount: countRes.count ?? 0,
        companyName: company,
        topProducts,
        grossProfit,
        salesForecast,
      }))
    } catch { /* non-fatal */ }
  }

  // ── Dynamic data (reloads when dateRange changes) ─────────────────────────
  const loadDocData = useCallback(async (range: DateRange) => {
    setDashData(prev => ({ ...prev, loading: true }))
    try {
      const { data: rawDocs } = await supabase
        .from('documents')
        .select('id, doc_type, status, total_amount, created_at, due_date, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const docs: DashboardDoc[] = (rawDocs ?? []).map((r) => {
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
      const { from: rangeFrom, to: rangeTo } = range

      // ── Revenue within selected date range (invoice + receipt + tax-invoice paid)
      const revenue30d = docs
        .filter(d =>
          REVENUE_DOC_TYPES.has(d.doc_type) &&
          d.status === 'paid' &&
          d.created_at.slice(0, 10) >= rangeFrom &&
          d.created_at.slice(0, 10) <= rangeTo,
        )
        .reduce((s, d) => s + d.total_amount, 0)

      // ── Sparkline (last 14 days, always fixed — not range-dependent)
      const sparklineMap = new Map<string, number>()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        sparklineMap.set(d.toISOString().slice(0, 10), 0)
      }
      for (const doc of docs) {
        if (!REVENUE_DOC_TYPES.has(doc.doc_type) || doc.status !== 'paid') continue
        const key = doc.created_at.slice(0, 10)
        if (sparklineMap.has(key)) sparklineMap.set(key, (sparklineMap.get(key) ?? 0) + doc.total_amount)
      }
      const sparkline = [...sparklineMap.entries()].map(([key, value]) => ({
        label: new Date(key).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        value,
      }))

      // ── Overdue + pending (always current, not date-filtered)
      const todayStr = now.toISOString().split('T')[0]
      const overdueDocs = docs.filter(
        d =>
          d.doc_type === 'invoice' &&
          d.status === 'sent' &&
          d.due_date != null &&
          d.due_date < todayStr,
      )
      const pendingDocs = docs.filter(d => d.doc_type === 'invoice' && d.status === 'sent')

      // ── Top spenders this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const spenderMap = new Map<string, number>()
      for (const doc of docs) {
        if (!REVENUE_DOC_TYPES.has(doc.doc_type) || doc.status !== 'paid') continue
        if (doc.created_at < monthStart) continue
        const name = doc.customer_name ?? '—'
        spenderMap.set(name, (spenderMap.get(name) ?? 0) + doc.total_amount)
      }
      const topSpenders: SpenderEntry[] = [...spenderMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, total]) => ({ name, total }))

      setDashData(prev => ({
        ...prev,
        loading: false,
        revenue30d,
        pendingAmount: pendingDocs.reduce((s, d) => s + d.total_amount, 0),
        pendingCount: pendingDocs.length,
        overdueAmount: overdueDocs.reduce((s, d) => s + d.total_amount, 0),
        overdueCount: overdueDocs.length,
        overdueDocs,
        sparkline,
        pendingDocs,
        recentDocs: docs.slice(0, 30),
        topSpenders,
        dateRange: range,
      }))
    } catch {
      setDashData(prev => ({ ...prev, loading: false }))
    }
  }, [userId])

  useEffect(() => {
    void loadDocData(dateRange)
  }, [dateRange, loadDocData])

  const displayName = dashData.companyName || user?.email?.split('@')[0] || 'ผู้ใช้งาน'

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          ยินดีต้อนรับ, <span className="font-medium text-slate-600">{displayName}</span>
        </p>
        <div className="mt-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>
      <OnboardingChecklist />
      <BentoGrid layout={layout} onLayoutChange={updateLayout} data={dashData} plan={plan} />
    </div>
  )
}
