export interface LineItem {
  id: string
  description: string
  detail: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  discountType: 'percent' | 'amount'  // % หรือจำนวนเงินคงที่ (บาท)
}

export interface DocumentSettings {
  currency: string        // "THB" | "USD" | "EUR" | "JPY" | "SGD" | "MYR"
  currencySymbol: string  // "฿" | "$" | "€" | "¥" | "S$" | "RM"
  themeColor: string      // hex เช่น "#1d4ed8"
  vatMode: 'exclusive' | 'inclusive'
}

export interface DocumentData {
  company: {
    name: string
    address: string
    phone: string
    email: string
    taxId: string
    logoUrl?: string
  }
  docMeta: {
    documentType: string
    number: string
    date: string
    credit: string
    salesperson: string
    projectName: string
  }
  customer: {
    name: string
    taxId: string
    address: string
    branch: string
  }
  items: LineItem[]
  notes: string
  summary: {
    specialDiscount: number
    specialDiscountType: 'percent' | 'amount'
    vatRate: number
  }
  footer: {
    sellerLabel: string
    approverName: string
    approverTitle: string
    buyerLabel: string
    signatureUrl?: string
    stampUrl?: string
    signatureDate: string
    bankName: string
    accountName: string
    accountNumber: string
  }
  settings: DocumentSettings
  visibility: {
    header: { address: boolean; phone: boolean; email: boolean; taxId: boolean }
    docMeta: { credit: boolean; salesperson: boolean; projectName: boolean }
    customer: { taxId: boolean; branch: boolean }
    table: { no: boolean; unit: boolean; discount: boolean }
    summary: { thaiText: boolean; specialDiscount: boolean; vat: boolean; notes: boolean }
    footer: { bankInfo: boolean; buyerSignature: boolean; stamp: boolean }
  }
}

// ─── Catalog: สินค้าที่เคยใช้ (เก็บใน localStorage) ───
export interface CatalogItem {
  description: string
  unit: string
  unitPrice: number
  discountType: 'percent' | 'amount'
}

export const DOCUMENT_TYPES = ['ใบเสนอราคา', 'ใบแจ้งหนี้', 'ใบเสร็จรับเงิน', 'ใบวางบิล', 'ใบกำกับภาษี']

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'THB', symbol: '฿', label: 'บาท (THB)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (MYR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (CNY)' },
]

export const THEME_COLORS = [
  { label: 'น้ำเงิน', value: '#1d4ed8' },
  { label: 'เขียว',  value: '#15803d' },
  { label: 'แดง',   value: '#b91c1c' },
  { label: 'ม่วง',  value: '#7c3aed' },
  { label: 'ส้ม',   value: '#c2410c' },
  { label: 'น้ำตาล', value: '#92400e' },
  { label: 'ดำ',    value: '#1e293b' },
]

export const defaultDocument: DocumentData = {
  company: {
    name: 'ชื่อบริษัท / ร้านค้า',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110',
    phone: '02-xxx-xxxx',
    email: 'info@company.com',
    taxId: '0000000000000',
  },
  docMeta: {
    documentType: 'ใบเสนอราคา',
    number: 'QT-2025-001',
    date: new Date().toISOString().split('T')[0],
    credit: '30 วัน',
    salesperson: '',
    projectName: '',
  },
  customer: { name: 'ชื่อลูกค้า / บริษัท', taxId: '', address: 'ที่อยู่ลูกค้า', branch: '' },
  items: [
    { id: '1', description: 'รายการสินค้า/บริการ', detail: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, discount: 0, discountType: 'percent' },
  ],
  notes: '',
  summary: { specialDiscount: 0, specialDiscountType: 'amount', vatRate: 7 },
  footer: {
    sellerLabel: 'ในนาม บริษัท',
    approverName: 'ชื่อผู้อนุมัติ',
    approverTitle: 'กรรมการผู้จัดการ',
    buyerLabel: 'ในนาม ลูกค้า / ผู้สั่งซื้อ',
    signatureDate: '',
    bankName: 'ธนาคาร',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'xxx-x-xxxxx-x',
  },
  settings: {
    currency: 'THB',
    currencySymbol: '฿',
    themeColor: '#1d4ed8',
    vatMode: 'exclusive',
  },
  visibility: {
    header: { address: true, phone: true, email: false, taxId: true },
    docMeta: { credit: true, salesperson: false, projectName: false },
    customer: { taxId: false, branch: false },
    table: { no: true, unit: true, discount: false },
    summary: { thaiText: true, specialDiscount: false, vat: true, notes: true },
    footer: { bankInfo: false, buyerSignature: true, stamp: false },
  },
}
