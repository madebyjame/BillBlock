export type WidgetId =
  | 'quick-actions'
  | 'revenue-goal'
  | 'overdue-invoices'
  | 'stock-alerts'
  | 'recent-activities'
  | 'quick-note'
  | 'top-spenders'

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
}

export const DEFAULT_LAYOUT: WidgetId[] = [
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

export interface DashboardDoc {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  total_amount: number
  created_at: string
  content: unknown
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

export interface DashboardData {
  loading: boolean
  revenue30d: number
  pendingAmount: number
  pendingCount: number
  sparkline: { label: string; value: number }[]
  pendingDocs: DashboardDoc[]
  recentDocs: DashboardDoc[]
  lowStockProducts: ProductAlert[]
  topSpenders: SpenderEntry[]
  customerCount: number
  companyName: string
  themeColor: string
}
