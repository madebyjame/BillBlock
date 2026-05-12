/**
 * dashboardApi.ts
 * All Supabase I/O for the dashboard — no direct DB calls allowed in widget components.
 */
import { supabase } from './supabase'
import {
  type WidgetId,
  type TopProductEntry,
  type GrossProfitSummary,
  type ForecastEntry,
} from '../types/dashboard'

// ─── Type-safe WidgetId guard ─────────────────────────────────────────────────

const ALL_WIDGET_IDS: readonly WidgetId[] = [
  // FREE (15)
  'quick-actions',
  'onboarding',
  'plan-usage',
  'recent-activities',
  'announcements',
  'revenue-30d',
  'total-outstanding',
  'pending-payments',
  'overdue-invoices',
  'top-sellers-qty',
  'top-products',
  'new-customers',
  'stock-alerts',
  'out-of-stock',
  'draft-documents',
  'goal-tracker',
  // PRO (20)
  'gross-profit',
  'cashflow-chart',
  'mom-revenue',
  'wht-summary',
  'revenue-goal',
  'top-invoice',
  'pipeline-value',
  'top-spenders',
  'customer-grades',
  'high-risk-customers',
  'inactive-customers',
  'portal-views',
  'low-stock-detail',
  'top-profitable-products',
  'recent-stock-adjustments',
  'total-stock-value',
  'quote-conversion-rate',
  'expiring-quotes',
  'payment-method-stats',
  'quick-note',
  // BUSINESS (15)
  'sales-forecast',
  'expected-cash-inflow',
  'vat-payable',
  'avg-payment-time',
  'revenue-concentration',
  'sales-by-salesperson',
  'top-converter-sales',
  'overdue-by-salesperson',
  'dead-stock',
  'inventory-turnover',
  'sales-by-category',
  'export-shortcuts',
  'cancellation-ratio',
  'audit-log',
  'ytd-summary',
] as const

function isWidgetId(v: unknown): v is WidgetId {
  return typeof v === 'string' && (ALL_WIDGET_IDS as readonly string[]).includes(v)
}

export function isKnownWidgetId(v: unknown): v is WidgetId {
  return isWidgetId(v)
}

// ─── Config persistence ───────────────────────────────────────────────────────

interface DashboardConfigDoc {
  version: number
  widgets: WidgetId[]
}

function isDashboardConfigDoc(v: unknown): v is DashboardConfigDoc {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return (
    obj['version'] === 1 &&
    Array.isArray(obj['widgets']) &&
    (obj['widgets'] as unknown[]).every(isWidgetId)
  )
}

// Returns null when no config is stored (distinct from an intentionally-empty [])
// so callers can decide whether to fall back to localStorage
export async function loadDashboardConfig(userId: string): Promise<WidgetId[] | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('dashboard_config')
      .eq('id', userId)
      .maybeSingle()

    if (data?.dashboard_config && isDashboardConfigDoc(data.dashboard_config)) {
      return data.dashboard_config.widgets
    }
  } catch {
    // network error or missing column — preserve local state
  }
  return null
}

export async function saveDashboardConfig(
  userId: string,
  widgets: WidgetId[],
): Promise<void> {
  const config: DashboardConfigDoc = { version: 1, widgets }
  await supabase
    .from('profiles')
    .update({ dashboard_config: config })
    .eq('id', userId)
}

// ─── Top products ─────────────────────────────────────────────────────────────

interface SalesByProductRow {
  product_id: unknown
  product_name: unknown
  quantity_sold: unknown
  revenue: unknown
}

function isSalesByProductRow(v: unknown): v is SalesByProductRow {
  if (typeof v !== 'object' || v === null) return false
  return true
}

export async function fetchTopProducts(userId: string): Promise<TopProductEntry[]> {
  const now = new Date()
  const dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()
  const dateTo = now.toISOString()

  try {
    const { data, error } = await supabase.rpc('get_sales_by_product', {
      uid: userId,
      date_from: dateFrom,
      date_to: dateTo,
    })
    if (error || !Array.isArray(data)) return []

    return (data as unknown[])
      .filter(isSalesByProductRow)
      .map((row) => ({
        product_id:    typeof row.product_id    === 'string' ? row.product_id    : String(row.product_id ?? ''),
        product_name:  typeof row.product_name  === 'string' ? row.product_name  : String(row.product_name ?? ''),
        quantity_sold: typeof row.quantity_sold === 'number' ? row.quantity_sold : Number(row.quantity_sold ?? 0),
        revenue:       typeof row.revenue       === 'number' ? row.revenue       : Number(row.revenue ?? 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  } catch {
    return []
  }
}

// ─── Gross profit summary ─────────────────────────────────────────────────────

interface PlSummaryRow {
  month_label: unknown
  revenue: unknown
  cogs: unknown
  gross_profit: unknown
}

function isPlSummaryRow(v: unknown): v is PlSummaryRow {
  return typeof v === 'object' && v !== null
}

function toNum(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

export async function fetchGrossProfitSummary(): Promise<GrossProfitSummary> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const fallback: GrossProfitSummary = {
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_pct: 0,
    month_label: now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
  }

  try {
    const { data, error } = await supabase.rpc('get_pl_summary', {
      date_from: monthStart,
      date_to: monthEnd,
    })
    if (error || !Array.isArray(data) || data.length === 0) return fallback

    const row = data[0] as unknown
    if (!isPlSummaryRow(row)) return fallback

    const revenue      = toNum(row.revenue)
    const cogs         = toNum(row.cogs)
    const gross_profit = revenue - cogs
    const gross_margin_pct = revenue > 0 ? (gross_profit / revenue) * 100 : 0

    return {
      revenue,
      cogs,
      gross_profit,
      gross_margin_pct,
      month_label: typeof row.month_label === 'string' ? row.month_label : fallback.month_label,
    }
  } catch {
    return fallback
  }
}

// ─── Sales forecast ───────────────────────────────────────────────────────────

export async function fetchSalesForecast(): Promise<ForecastEntry[]> {
  const now = new Date()
  // Fetch 6 complete months back
  const dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString()
  const dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  try {
    const { data, error } = await supabase.rpc('get_pl_summary', {
      date_from: dateFrom,
      date_to:   dateTo,
    })

    // Build a map month_label -> revenue from RPC results
    const rpcMap = new Map<string, number>()
    if (!error && Array.isArray(data)) {
      for (const item of data as unknown[]) {
        if (!isPlSummaryRow(item)) continue
        if (typeof item.month_label === 'string') {
          rpcMap.set(item.month_label, toNum(item.revenue))
        }
      }
    }

    // Build 6-month actuals from deterministic month labels
    const actuals: ForecastEntry[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
      actuals.push({ month_label: label, actual: rpcMap.get(label) ?? 0, forecast: null })
    }

    // 3-month moving average of the last 3 actuals as forecast for next month
    const last3 = actuals.slice(-3).map(e => e.actual ?? 0)
    const avg   = last3.reduce((s, v) => s + v, 0) / (last3.length || 1)

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextLabel = nextMonth.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
    actuals.push({ month_label: nextLabel, actual: null, forecast: Math.round(avg) })

    return actuals
  } catch {
    return []
  }
}
