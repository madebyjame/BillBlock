import type { Plan } from '../lib/planLimits'

export type WidgetId =
  // FREE (15)
  | 'quick-actions'       // #1 - existing
  | 'onboarding'          // #2 - existing
  | 'plan-usage'          // #3 - NEW
  | 'recent-activities'   // #4 - existing
  | 'announcements'       // #5 - NEW
  | 'revenue-30d'         // #6 - NEW
  | 'total-outstanding'   // #7 - NEW
  | 'pending-payments'    // #8 - NEW
  | 'overdue-invoices'    // #9 - existing
  | 'top-sellers-qty'     // #10 - NEW (top 5 by qty sold)
  | 'new-customers'       // #11 - NEW
  | 'stock-alerts'        // #12 - existing (count only)
  | 'out-of-stock'        // #13 - NEW
  | 'draft-documents'     // #14 - NEW
  | 'goal-tracker'        // #15 - NEW
  // PRO (20)
  | 'gross-profit'        // #16 - existing
  | 'cashflow-chart'      // #17 - NEW stub
  | 'mom-revenue'         // #18 - NEW stub
  | 'wht-summary'         // #19 - NEW stub
  | 'revenue-goal'        // #20 - existing (sparkline/trend)
  | 'top-invoice'         // #21 - NEW stub
  | 'pipeline-value'      // #22 - NEW stub
  | 'top-spenders'        // #23 - existing
  | 'customer-grades'     // #24 - existing
  | 'high-risk-customers' // #25 - NEW stub
  | 'inactive-customers'  // #26 - NEW stub
  | 'portal-views'        // #27 - NEW stub
  | 'low-stock-detail'    // #28 - existing
  | 'top-profitable-products' // #29 - NEW stub
  | 'recent-stock-adjustments' // #30 - NEW stub
  | 'total-stock-value'   // #31 - NEW stub
  | 'quote-conversion-rate' // #32 - NEW stub
  | 'expiring-quotes'     // #33 - NEW stub
  | 'payment-method-stats' // #34 - NEW stub
  | 'quick-note'          // #35 - existing (sticky note)
  // BUSINESS (15)
  | 'sales-forecast'      // #36 - existing
  | 'expected-cash-inflow' // #37 - NEW stub
  | 'vat-payable'         // #38 - NEW stub
  | 'avg-payment-time'    // #39 - NEW stub
  | 'revenue-concentration' // #40 - NEW stub
  | 'sales-by-salesperson' // #41 - NEW stub
  | 'top-converter-sales' // #42 - NEW stub
  | 'overdue-by-salesperson' // #43 - NEW stub
  | 'dead-stock'          // #44 - NEW stub
  | 'inventory-turnover'  // #45 - NEW stub
  | 'sales-by-category'   // #46 - NEW stub
  | 'export-shortcuts'    // #47 - NEW stub
  | 'cancellation-ratio'  // #48 - NEW stub
  | 'audit-log'           // #49 - NEW stub
  | 'ytd-summary'         // #50 - NEW stub

export interface WidgetMeta {
  colSpan: 1 | 2
  rowSpan: 1 | 2
  titleTh: string
}

export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  // FREE
  'quick-actions':          { colSpan: 1, rowSpan: 1, titleTh: 'ทางลัดด่วน' },
  'onboarding':             { colSpan: 1, rowSpan: 1, titleTh: 'เริ่มต้นใช้งาน' },
  'plan-usage':             { colSpan: 1, rowSpan: 1, titleTh: 'การใช้งานแพ็กเกจ' },
  'recent-activities':      { colSpan: 2, rowSpan: 1, titleTh: 'ความเคลื่อนไหวล่าสุด' },
  'announcements':          { colSpan: 2, rowSpan: 1, titleTh: 'ข่าวสาร' },
  'revenue-30d':            { colSpan: 1, rowSpan: 1, titleTh: 'รายได้ 30 วัน' },
  'total-outstanding':      { colSpan: 1, rowSpan: 1, titleTh: 'ยอดค้างชำระทั้งหมด' },
  'pending-payments':       { colSpan: 1, rowSpan: 1, titleTh: 'รอเก็บเงิน' },
  'overdue-invoices':       { colSpan: 1, rowSpan: 1, titleTh: 'ค้างชำระ' },
  'top-sellers-qty':        { colSpan: 1, rowSpan: 1, titleTh: 'สินค้าขายดี (จำนวน)' },
  'new-customers':          { colSpan: 1, rowSpan: 1, titleTh: 'ลูกค้าใหม่เดือนนี้' },
  'stock-alerts':           { colSpan: 1, rowSpan: 1, titleTh: 'แจ้งเตือนสต็อก' },
  'out-of-stock':           { colSpan: 1, rowSpan: 1, titleTh: 'สินค้าหมด' },
  'draft-documents':        { colSpan: 1, rowSpan: 1, titleTh: 'เอกสารฉบับร่าง' },
  'goal-tracker':           { colSpan: 1, rowSpan: 1, titleTh: 'เป้าหมายรายเดือน' },
  // PRO
  'gross-profit':           { colSpan: 1, rowSpan: 1, titleTh: 'กำไรขั้นต้น' },
  'cashflow-chart':         { colSpan: 2, rowSpan: 1, titleTh: 'กระแสเงินสด 6 เดือน' },
  'mom-revenue':            { colSpan: 1, rowSpan: 1, titleTh: 'เทียบยอดเดือนที่แล้ว' },
  'wht-summary':            { colSpan: 1, rowSpan: 1, titleTh: 'WHT สะสม' },
  'revenue-goal':           { colSpan: 2, rowSpan: 2, titleTh: 'รายได้ & เป้าหมาย' },
  'top-invoice':            { colSpan: 1, rowSpan: 1, titleTh: 'ใบแจ้งหนี้สูงสุด' },
  'pipeline-value':         { colSpan: 1, rowSpan: 1, titleTh: 'มูลค่า Pipeline' },
  'top-spenders':           { colSpan: 1, rowSpan: 1, titleTh: 'ลูกค้าชั้นดี' },
  'customer-grades':        { colSpan: 1, rowSpan: 2, titleTh: 'เกรดลูกค้า' },
  'high-risk-customers':    { colSpan: 1, rowSpan: 1, titleTh: 'ลูกค้าหนี้เสีย' },
  'inactive-customers':     { colSpan: 1, rowSpan: 1, titleTh: 'ลูกค้าที่หายไป' },
  'portal-views':           { colSpan: 1, rowSpan: 1, titleTh: 'สถิติดูเอกสาร' },
  'low-stock-detail':       { colSpan: 1, rowSpan: 1, titleTh: 'Low Stock ละเอียด' },
  'top-profitable-products':{ colSpan: 1, rowSpan: 1, titleTh: 'สินค้ากำไรสูงสุด' },
  'recent-stock-adjustments':{ colSpan: 1, rowSpan: 1, titleTh: 'ประวัติปรับสต็อก' },
  'total-stock-value':      { colSpan: 1, rowSpan: 1, titleTh: 'มูลค่าสต็อกรวม' },
  'quote-conversion-rate':  { colSpan: 1, rowSpan: 1, titleTh: 'อัตราปิดการขาย' },
  'expiring-quotes':        { colSpan: 1, rowSpan: 1, titleTh: 'ใบเสนอราคาใกล้หมดอายุ' },
  'payment-method-stats':   { colSpan: 1, rowSpan: 1, titleTh: 'ช่องทางชำระเงิน' },
  'quick-note':             { colSpan: 1, rowSpan: 1, titleTh: 'โน้ตด่วน' },
  // BUSINESS
  'sales-forecast':         { colSpan: 2, rowSpan: 1, titleTh: 'Sales Forecast' },
  'expected-cash-inflow':   { colSpan: 2, rowSpan: 1, titleTh: 'คาดการณ์เงินเข้า' },
  'vat-payable':            { colSpan: 1, rowSpan: 1, titleTh: 'VAT รอยื่น' },
  'avg-payment-time':       { colSpan: 1, rowSpan: 1, titleTh: 'เวลาเก็บเงินเฉลี่ย' },
  'revenue-concentration':  { colSpan: 1, rowSpan: 1, titleTh: 'ความเสี่ยงลูกค้าเดียว' },
  'sales-by-salesperson':   { colSpan: 1, rowSpan: 1, titleTh: 'ยอดขายรายพนักงาน' },
  'top-converter-sales':    { colSpan: 1, rowSpan: 1, titleTh: 'พนักงานปิดยอดเก่ง' },
  'overdue-by-salesperson': { colSpan: 1, rowSpan: 1, titleTh: 'หนี้ค้างรายเซลส์' },
  'dead-stock':             { colSpan: 1, rowSpan: 1, titleTh: 'สินค้าค้างสต็อก' },
  'inventory-turnover':     { colSpan: 1, rowSpan: 1, titleTh: 'อัตราหมุนเวียนสินค้า' },
  'sales-by-category':      { colSpan: 1, rowSpan: 1, titleTh: 'ยอดขายตามหมวด' },
  'export-shortcuts':       { colSpan: 1, rowSpan: 1, titleTh: 'Export ข้อมูล' },
  'cancellation-ratio':     { colSpan: 1, rowSpan: 1, titleTh: 'อัตรายกเลิกเอกสาร' },
  'audit-log':              { colSpan: 1, rowSpan: 1, titleTh: 'ประวัติการใช้งาน' },
  'ytd-summary':            { colSpan: 2, rowSpan: 1, titleTh: 'ภาพรวมปีปัจจุบัน' },
}

// Default layout — standard template shown on first visit / no saved config
export const DEFAULT_LAYOUT: WidgetId[] = [
  'quick-actions',
  'revenue-30d',
  'overdue-invoices',
  'recent-activities',
  'stock-alerts',
  'draft-documents',
  'pending-payments',
  'new-customers',
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
  // FREE (15)
  { id: 'quick-actions',     titleTh: 'ทางลัดด่วน',              descriptionTh: 'สร้างเอกสารได้เร็ว',                     colSpan: 1, requiredPlan: 'free' },
  { id: 'onboarding',        titleTh: 'เริ่มต้นใช้งาน',          descriptionTh: 'Checklist ตั้งค่าครั้งแรก',              colSpan: 1, requiredPlan: 'free' },
  { id: 'plan-usage',        titleTh: 'การใช้งานแพ็กเกจ',        descriptionTh: 'โควต้าเอกสาร/ลูกค้า/สินค้า',            colSpan: 1, requiredPlan: 'free' },
  { id: 'recent-activities', titleTh: 'ความเคลื่อนไหว',          descriptionTh: 'เอกสารล่าสุด',                           colSpan: 2, requiredPlan: 'free' },
  { id: 'announcements',     titleTh: 'ข่าวสาร',                 descriptionTh: 'ข่าวสารและอัปเดตจาก BillBlock',          colSpan: 2, requiredPlan: 'free' },
  { id: 'revenue-30d',       titleTh: 'รายได้ 30 วัน',          descriptionTh: 'รายได้จากใบแจ้งหนี้ที่ชำระแล้ว',         colSpan: 1, requiredPlan: 'free' },
  { id: 'total-outstanding', titleTh: 'ยอดค้างชำระทั้งหมด',     descriptionTh: 'รอชำระ + เกินกำหนด',                     colSpan: 1, requiredPlan: 'free' },
  { id: 'pending-payments',  titleTh: 'รอเก็บเงิน',             descriptionTh: 'ใบแจ้งหนี้ที่ยังไม่ชำระ',                colSpan: 1, requiredPlan: 'free' },
  { id: 'overdue-invoices',  titleTh: 'ค้างชำระ',               descriptionTh: 'ใบแจ้งหนี้เกินกำหนด',                   colSpan: 1, requiredPlan: 'free' },
  { id: 'top-sellers-qty',   titleTh: 'สินค้าขายดี (จำนวน)',    descriptionTh: 'Top 5 สินค้าตามจำนวนขาย',               colSpan: 1, requiredPlan: 'free' },
  { id: 'new-customers',     titleTh: 'ลูกค้าใหม่เดือนนี้',    descriptionTh: 'จำนวนลูกค้าที่เพิ่มเดือนนี้',            colSpan: 1, requiredPlan: 'free' },
  { id: 'stock-alerts',      titleTh: 'แจ้งเตือนสต็อก',        descriptionTh: 'สินค้าใกล้หมด',                          colSpan: 1, requiredPlan: 'free' },
  { id: 'out-of-stock',      titleTh: 'สินค้าหมด',              descriptionTh: 'สินค้าที่สต็อก = 0',                     colSpan: 1, requiredPlan: 'free' },
  { id: 'draft-documents',   titleTh: 'เอกสารฉบับร่าง',        descriptionTh: 'เอกสารที่ยังไม่ส่ง',                     colSpan: 1, requiredPlan: 'free' },
  { id: 'goal-tracker',      titleTh: 'เป้าหมายรายเดือน',      descriptionTh: 'ตั้งและติดตามเป้ายอดขาย',                colSpan: 1, requiredPlan: 'free' },
  // PRO (20)
  { id: 'gross-profit',      titleTh: 'กำไรขั้นต้นเดือนนี้',   descriptionTh: 'Revenue − COGS = Gross Profit',           colSpan: 1, requiredPlan: 'pro' },
  { id: 'cashflow-chart',    titleTh: 'กระแสเงินสด 6 เดือน',  descriptionTh: 'เงินเข้า-ออกรายเดือน',                   colSpan: 2, requiredPlan: 'pro' },
  { id: 'mom-revenue',       titleTh: 'เทียบยอดเดือนที่แล้ว', descriptionTh: 'เปรียบเทียบรายได้เดือนนี้กับเดือนก่อน',  colSpan: 1, requiredPlan: 'pro' },
  { id: 'wht-summary',       titleTh: 'WHT สะสม',             descriptionTh: 'ภาษีหัก ณ ที่จ่ายสะสม',                  colSpan: 1, requiredPlan: 'pro' },
  { id: 'revenue-goal',      titleTh: 'รายได้ & เป้าหมาย',    descriptionTh: 'กราฟรายได้ 14 วัน',                       colSpan: 2, requiredPlan: 'pro' },
  { id: 'top-invoice',       titleTh: 'ใบแจ้งหนี้สูงสุด',     descriptionTh: 'ใบแจ้งหนี้มูลค่าสูงสุดเดือนนี้',        colSpan: 1, requiredPlan: 'pro' },
  { id: 'pipeline-value',    titleTh: 'มูลค่า Pipeline',      descriptionTh: 'ใบเสนอราคาที่รอปิดการขาย',               colSpan: 1, requiredPlan: 'pro' },
  { id: 'top-spenders',      titleTh: 'ลูกค้าชั้นดี',        descriptionTh: 'Top spenders เดือนนี้',                   colSpan: 1, requiredPlan: 'pro' },
  { id: 'customer-grades',   titleTh: 'เกรดลูกค้า',           descriptionTh: 'A/B/F rating',                            colSpan: 1, requiredPlan: 'pro' },
  { id: 'high-risk-customers',  titleTh: 'ลูกค้าหนี้เสีย',   descriptionTh: 'ลูกค้าที่ค้างชำระเกิน 90 วัน',           colSpan: 1, requiredPlan: 'pro' },
  { id: 'inactive-customers',   titleTh: 'ลูกค้าที่หายไป',   descriptionTh: 'ไม่มีธุรกรรมนาน 3 เดือน',                colSpan: 1, requiredPlan: 'pro' },
  { id: 'portal-views',         titleTh: 'สถิติดูเอกสาร',     descriptionTh: 'จำนวนครั้งที่ลูกค้าเปิดเอกสาร',          colSpan: 1, requiredPlan: 'pro' },
  { id: 'low-stock-detail',     titleTh: 'Low Stock ละเอียด', descriptionTh: 'แสดงระดับสต็อกเป็น % พร้อมคำแนะนำ',      colSpan: 1, requiredPlan: 'pro' },
  { id: 'top-profitable-products', titleTh: 'สินค้ากำไรสูงสุด', descriptionTh: 'สินค้าที่ทำกำไรสูงสุด',               colSpan: 1, requiredPlan: 'pro' },
  { id: 'recent-stock-adjustments', titleTh: 'ประวัติปรับสต็อก', descriptionTh: 'การปรับสต็อกล่าสุด',                  colSpan: 1, requiredPlan: 'pro' },
  { id: 'total-stock-value',    titleTh: 'มูลค่าสต็อกรวม',   descriptionTh: 'มูลค่าสินค้าคงเหลือทั้งหมด',             colSpan: 1, requiredPlan: 'pro' },
  { id: 'quote-conversion-rate', titleTh: 'อัตราปิดการขาย',  descriptionTh: 'ใบเสนอราคาที่ปิดเป็นออเดอร์ (%)',        colSpan: 1, requiredPlan: 'pro' },
  { id: 'expiring-quotes',      titleTh: 'ใบเสนอราคาใกล้หมดอายุ', descriptionTh: 'ใบเสนอราคาที่จะหมดอายุใน 7 วัน',   colSpan: 1, requiredPlan: 'pro' },
  { id: 'payment-method-stats', titleTh: 'ช่องทางชำระเงิน',  descriptionTh: 'สถิติการชำระเงินแต่ละช่องทาง',           colSpan: 1, requiredPlan: 'pro' },
  { id: 'quick-note',           titleTh: 'โน้ตด่วน',         descriptionTh: 'จดบันทึกชั่วคราว',                        colSpan: 1, requiredPlan: 'pro' },
  // BUSINESS (15)
  { id: 'sales-forecast',    titleTh: 'Sales Forecast',       descriptionTh: 'คาดการณ์ยอดขายเดือนหน้า (3-month avg)', colSpan: 2, requiredPlan: 'business' },
  { id: 'expected-cash-inflow', titleTh: 'คาดการณ์เงินเข้า', descriptionTh: 'เงินที่คาดว่าจะได้รับจากลูกหนี้',        colSpan: 2, requiredPlan: 'business' },
  { id: 'vat-payable',       titleTh: 'VAT รอยื่น',          descriptionTh: 'ภาษีมูลค่าเพิ่มที่ต้องยื่นเดือนนี้',    colSpan: 1, requiredPlan: 'business' },
  { id: 'avg-payment-time',  titleTh: 'เวลาเก็บเงินเฉลี่ย', descriptionTh: 'DSO — จำนวนวันเฉลี่ยในการเก็บเงิน',      colSpan: 1, requiredPlan: 'business' },
  { id: 'revenue-concentration', titleTh: 'ความเสี่ยงลูกค้าเดียว', descriptionTh: '% รายได้จากลูกค้าอันดับ 1',        colSpan: 1, requiredPlan: 'business' },
  { id: 'sales-by-salesperson', titleTh: 'ยอดขายรายพนักงาน', descriptionTh: 'ยอดขายแยกตามเซลส์',                    colSpan: 1, requiredPlan: 'business' },
  { id: 'top-converter-sales', titleTh: 'พนักงานปิดยอดเก่ง', descriptionTh: 'เซลส์ที่มีอัตราปิดสูงสุด',               colSpan: 1, requiredPlan: 'business' },
  { id: 'overdue-by-salesperson', titleTh: 'หนี้ค้างรายเซลส์', descriptionTh: 'ยอดค้างชำระแยกตามเซลส์',             colSpan: 1, requiredPlan: 'business' },
  { id: 'dead-stock',        titleTh: 'สินค้าค้างสต็อก',     descriptionTh: 'สินค้าที่ไม่ขายมานานกว่า 90 วัน',        colSpan: 1, requiredPlan: 'business' },
  { id: 'inventory-turnover', titleTh: 'อัตราหมุนเวียนสินค้า', descriptionTh: 'ความถี่ที่สต็อกหมุนเวียนต่อปี',        colSpan: 1, requiredPlan: 'business' },
  { id: 'sales-by-category', titleTh: 'ยอดขายตามหมวด',       descriptionTh: 'ยอดขายแยกตามหมวดหมู่สินค้า',            colSpan: 1, requiredPlan: 'business' },
  { id: 'export-shortcuts',  titleTh: 'Export ข้อมูล',       descriptionTh: 'ส่งออกรายงานด้วยคลิกเดียว',              colSpan: 1, requiredPlan: 'business' },
  { id: 'cancellation-ratio', titleTh: 'อัตรายกเลิกเอกสาร', descriptionTh: '% เอกสารที่ถูกยกเลิก',                   colSpan: 1, requiredPlan: 'business' },
  { id: 'audit-log',         titleTh: 'ประวัติการใช้งาน',    descriptionTh: 'ติดตามการเปลี่ยนแปลงในระบบ',             colSpan: 1, requiredPlan: 'business' },
  { id: 'ytd-summary',       titleTh: 'ภาพรวมปีปัจจุบัน',   descriptionTh: 'สรุปผลประกอบการตั้งแต่ต้นปี',            colSpan: 2, requiredPlan: 'business' },
]

// ─── DateRange types ──────────────────────────────────────────────────────────

export type DateRangeKey = 'today' | '7d' | '30d' | 'this-month' | 'this-quarter' | 'this-year' | 'all-time' | 'custom'

export interface DateRange {
  key: DateRangeKey
  from: string   // ISO date string YYYY-MM-DD
  to: string     // ISO date string YYYY-MM-DD
  label: string
}

export function getDateRange(key: DateRangeKey, customFrom?: string, customTo?: string): DateRange {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const todayStr = fmt(today)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  const ranges: Record<Exclude<DateRangeKey, 'custom'>, DateRange> = {
    'today':        { key: 'today',        from: todayStr, to: todayStr, label: 'วันนี้' },
    '7d':           { key: '7d',           from: fmt(new Date(today.getTime() - 6*86400000)), to: todayStr, label: '7 วันล่าสุด' },
    '30d':          { key: '30d',          from: fmt(new Date(today.getTime() - 29*86400000)), to: todayStr, label: '30 วันล่าสุด' },
    'this-month':   { key: 'this-month',   from: fmt(startOfMonth), to: todayStr, label: 'เดือนนี้' },
    'this-quarter': { key: 'this-quarter', from: fmt(startOfQuarter), to: todayStr, label: 'ไตรมาสนี้' },
    'this-year':    { key: 'this-year',    from: fmt(startOfYear), to: todayStr, label: 'ปีนี้' },
    'all-time':     { key: 'all-time',     from: '2020-01-01', to: todayStr, label: 'ทั้งหมด' },
  }

  if (key === 'custom') {
    return { key: 'custom', from: customFrom ?? todayStr, to: customTo ?? todayStr, label: 'กำหนดเอง' }
  }
  return ranges[key]
}

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
  dateRange: DateRange
}

// Re-export Plan so BentoGrid / WidgetDrawer can import from a single place
export type { Plan }
