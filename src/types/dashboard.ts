import type { Plan } from '../lib/planLimits'

export type WidgetId =
  | 'quick-actions'
  | 'revenue-goal'
  | 'overdue-invoices'
  | 'stock-alerts'
  | 'recent-activities'
  | 'quick-note'
  | 'top-spenders'
  | 'customer-grades'
  | 'onboarding'
  | 'top-products'
  | 'gross-profit'
  | 'low-stock-detail'
  | 'sales-forecast'

export interface WidgetMeta {
  colSpan: 1 | 2
  rowSpan: 1 | 2
  titleTh: string
}

export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  'quick-actions':     { colSpan: 1, rowSpan: 1, titleTh: 'ทางลัดด่วน' },
  'revenue-goal':      { colSpan: 2, rowSpan: 2, titleTh: 'รายได้ & เป้าหมาย' },
  'overdue-invoices':  { colSpan: 1, rowSpan: 1, titleTh: 'ค้างชำระ' },
  'stock-alerts':      { colSpan: 1, rowSpan: 1, titleTh: 'แจ้งเตือนสต็อก' },
  'recent-activities': { colSpan: 2, rowSpan: 1, titleTh: 'ความเคลื่อนไหวล่าสุด' },
  'quick-note':        { colSpan: 1, rowSpan: 1, titleTh: 'โน้ตด่วน' },
  'top-spenders':      { colSpan: 1, rowSpan: 1, titleTh: 'ลูกค้าชั้นดี' },
  'customer-grades':   { colSpan: 1, rowSpan: 2, titleTh: 'เกรดลูกค้า' },
  'onboarding':        { colSpan: 1, rowSpan: 1, titleTh: 'เริ่มต้นใช้งาน' },
  'top-products':      { colSpan: 1, rowSpan: 1, titleTh: 'สินค้าขายดี Top 5' },
  'gross-profit':      { colSpan: 1, rowSpan: 1, titleTh: 'กำไรขั้นต้น' },
  'low-stock-detail':  { colSpan: 1, rowSpan: 1, titleTh: 'Low Stock ละเอียด' },
  'sales-forecast':    { colSpan: 2, rowSpan: 1, titleTh: 'Sales Forecast' },
}

export const DEFAULT_LAYOUT: WidgetId[] = [
  'onboarding',
  'quick-actions',
  'revenue-goal',
  'overdue-invoices',
  'recent-activities',
  'top-spenders',
  'stock-alerts',
  'quick-note',
]

export const PRESET_TEMPLATES: Record<string, { name: string; layout: WidgetId[] }> = {
  standard: {
    name: 'มาตรฐาน',
    layout: ['quick-actions', 'revenue-goal', 'overdue-invoices', 'recent-activities', 'top-spenders', 'stock-alerts', 'quick-note'],
  },
  sales: {
    name: 'โฟกัสยอดขาย',
    layout: ['revenue-goal', 'overdue-invoices', 'top-spenders', 'recent-activities', 'quick-actions', 'stock-alerts', 'quick-note'],
  },
}

// ─── Plan-gated widget registry ──────────────────────────────────────────────

export type RequiredPlan = 'free' | 'pro' | 'business'

export interface WidgetRegistryEntry {
  id: WidgetId
  titleTh: string
  descriptionTh: string
  colSpan: 1 | 2
  requiredPlan: RequiredPlan
}

export const WIDGET_REGISTRY: WidgetRegistryEntry[] = [
  { id: 'quick-actions',    titleTh: 'ทางลัดด่วน',           descriptionTh: 'สร้างเอกสารได้เร็ว',                          colSpan: 1, requiredPlan: 'free' },
  { id: 'revenue-goal',     titleTh: 'รายได้ & เป้าหมาย',    descriptionTh: 'กราฟรายได้ 14 วัน',                           colSpan: 2, requiredPlan: 'free' },
  { id: 'overdue-invoices', titleTh: 'ค้างชำระ',              descriptionTh: 'ใบแจ้งหนี้เกินกำหนด',                        colSpan: 1, requiredPlan: 'free' },
  { id: 'stock-alerts',     titleTh: 'แจ้งเตือนสต็อก',       descriptionTh: 'สินค้าใกล้หมด',                              colSpan: 1, requiredPlan: 'free' },
  { id: 'recent-activities',titleTh: 'ความเคลื่อนไหว',        descriptionTh: 'เอกสารล่าสุด',                               colSpan: 2, requiredPlan: 'free' },
  { id: 'quick-note',       titleTh: 'โน้ตด่วน',              descriptionTh: 'จดบันทึกชั่วคราว',                           colSpan: 1, requiredPlan: 'free' },
  { id: 'top-spenders',     titleTh: 'ลูกค้าชั้นดี',         descriptionTh: 'Top spenders เดือนนี้',                       colSpan: 1, requiredPlan: 'free' },
  { id: 'customer-grades',  titleTh: 'เกรดลูกค้า',            descriptionTh: 'A/B/F rating',                               colSpan: 1, requiredPlan: 'free' },
  { id: 'onboarding',       titleTh: 'เริ่มต้นใช้งาน',       descriptionTh: 'Checklist ตั้งค่าครั้งแรก',                  colSpan: 1, requiredPlan: 'free' },
  { id: 'top-products',     titleTh: 'สินค้าขายดี Top 5',    descriptionTh: 'จำนวนขายและรายได้รายสินค้า',                  colSpan: 1, requiredPlan: 'free' },
  { id: 'gross-profit',     titleTh: 'กำไรขั้นต้นเดือนนี้', descriptionTh: 'Revenue − COGS = Gross Profit',               colSpan: 1, requiredPlan: 'pro' },
  { id: 'low-stock-detail', titleTh: 'Low Stock ละเอียด',    descriptionTh: 'แสดงระดับสต็อกเป็น % พร้อมคำแนะนำ',          colSpan: 1, requiredPlan: 'pro' },
  { id: 'sales-forecast',   titleTh: 'Sales Forecast',        descriptionTh: 'คาดการณ์ยอดขายเดือนหน้า (3-month avg)',      colSpan: 2, requiredPlan: 'business' },
]

// ─── Dashboard document / product types ──────────────────────────────────────

export interface DashboardDoc {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  total_amount: number
  created_at: string
  due_date?: string | null
  content?: unknown
  doc_number?: string
  customer_name?: string
}

export interface ProductAlert {
  id: string
  name: string
  stock: number
  unit: string
}

export interface SpenderEntry {
  name: string
  total: number
}

export interface GradeEntry {
  customer_id: string
  customer_name: string
  grade: 'A' | 'B' | 'F'
  on_time_count: number
  late_count: number
  overdue_count: number
}

// ─── New widget data types ────────────────────────────────────────────────────

export interface TopProductEntry {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface GrossProfitSummary {
  revenue: number
  cogs: number
  gross_profit: number
  gross_margin_pct: number
  month_label: string
}

export interface ForecastEntry {
  month_label: string
  actual: number | null
  forecast: number | null
}

// ─── Main dashboard data shape ────────────────────────────────────────────────

export interface DashboardData {
  loading: boolean
  revenue30d: number
  pendingAmount: number
  pendingCount: number
  overdueAmount: number
  overdueCount: number
  overdueDocs: DashboardDoc[]
  sparkline: { label: string; value: number }[]
  pendingDocs: DashboardDoc[]
  recentDocs: DashboardDoc[]
  lowStockProducts: ProductAlert[]
  topSpenders: SpenderEntry[]
  customerGrades: GradeEntry[]
  customerCount: number
  companyName: string
  themeColor: string
  topProducts: TopProductEntry[]
  grossProfit: GrossProfitSummary
  salesForecast: ForecastEntry[]
}

// Re-export Plan so BentoGrid / WidgetDrawer can import from a single place
export type { Plan }
