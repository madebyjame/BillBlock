// ============================================================
// Block Types — Bill Block App (v2)
// ใช้ Discriminated Union + visibleFields สำหรับ hide/show
// ============================================================

export type BlockType =
  | 'header'
  | 'docInfo'
  | 'customer'
  | 'table'
  | 'summary'
  | 'footer'

// ─────────────────────────────────────────
// Header Block
// ─────────────────────────────────────────
export interface HeaderBlockData {
  companyName: string
  address: string
  phone: string
  email: string
  taxId: string
  logoUrl?: string
  visibleFields: {
    address: boolean
    phone: boolean
    email: boolean
    taxId: boolean
  }
}

// ─────────────────────────────────────────
// Document Info Block
// ─────────────────────────────────────────
export interface DocInfoBlockData {
  documentType: string
  documentNumber: string
  documentDate: string
  dueDate: string
  salesperson: string
  paymentTerms: string
  projectName: string
  visibleFields: {
    dueDate: boolean
    salesperson: boolean
    paymentTerms: boolean
    projectName: boolean
  }
}

// ─────────────────────────────────────────
// Customer Block
// ─────────────────────────────────────────
export interface CustomerBlockData {
  customerName: string
  taxId: string
  address: string
  phone: string
  visibleFields: {
    taxId: boolean
    phone: boolean
  }
}

// ─────────────────────────────────────────
// Table Block
// ─────────────────────────────────────────
export interface TableRow {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number   // ส่วนลดต่อแถวเป็น %
}

export interface TableBlockData {
  rows: TableRow[]
  visibleColumns: {
    unit: boolean
    discount: boolean
  }
}

// ─────────────────────────────────────────
// Summary Block
// ─────────────────────────────────────────
export interface SummaryBlockData {
  discountAmount: number   // ส่วนลดพิเศษ (บาท)
  vatRate: number
  visibleFields: {
    thaiText: boolean      // ข้อความจำนวนเงินภาษาไทย
    discount: boolean      // แถวส่วนลดพิเศษ
    vat: boolean           // VAT
  }
}

// ─────────────────────────────────────────
// Footer Block
// ─────────────────────────────────────────
export interface FooterBlockData {
  bankName: string
  accountName: string
  accountNumber: string
  signerName: string
  signerTitle: string
  customerSignerLabel: string
  signatureImageUrl?: string    // รูปลายเซ็น
  stampImageUrl?: string        // รูปตราประทับ
  visibleFields: {
    bankInfo: boolean
    customerSignature: boolean
    stamp: boolean
  }
}

// ─────────────────────────────────────────
// Discriminated Union
// ─────────────────────────────────────────
export type Block =
  | { id: string; type: 'header';   data: HeaderBlockData }
  | { id: string; type: 'docInfo';  data: DocInfoBlockData }
  | { id: string; type: 'customer'; data: CustomerBlockData }
  | { id: string; type: 'table';    data: TableBlockData }
  | { id: string; type: 'summary';  data: SummaryBlockData }
  | { id: string; type: 'footer';   data: FooterBlockData }

// ─────────────────────────────────────────
// Default data
// ─────────────────────────────────────────
export const defaultBlockData: Record<BlockType, Block['data']> = {
  header: {
    companyName: 'ชื่อบริษัท / ร้านค้า',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
    phone: '02-xxx-xxxx',
    email: 'info@company.com',
    taxId: '0000000000000',
    visibleFields: { address: true, phone: true, email: true, taxId: true },
  } satisfies HeaderBlockData,

  docInfo: {
    documentType: 'ใบเสนอราคา',
    documentNumber: 'QT-2025-001',
    documentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    salesperson: '',
    paymentTerms: 'ชำระเงินภายใน 30 วัน',
    projectName: '',
    visibleFields: { dueDate: true, salesperson: false, paymentTerms: true, projectName: false },
  } satisfies DocInfoBlockData,

  customer: {
    customerName: 'ชื่อลูกค้า / บริษัท',
    taxId: '',
    address: 'ที่อยู่ลูกค้า',
    phone: '',
    visibleFields: { taxId: false, phone: false },
  } satisfies CustomerBlockData,

  table: {
    rows: [
      { id: '1', description: 'รายการสินค้า/บริการ', quantity: 1, unit: 'ชิ้น', unitPrice: 0, discount: 0 },
    ],
    visibleColumns: { unit: true, discount: false },
  } satisfies TableBlockData,

  summary: {
    discountAmount: 0,
    vatRate: 7,
    visibleFields: { thaiText: true, discount: false, vat: true },
  } satisfies SummaryBlockData,

  footer: {
    bankName: 'ธนาคารกสิกรไทย',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'xxx-x-xxxxx-x',
    signerName: 'ชื่อผู้มีอำนาจ',
    signerTitle: 'กรรมการผู้จัดการ',
    customerSignerLabel: 'ผู้รับบริการ / ลูกค้า',
    visibleFields: { bankInfo: true, customerSignature: true, stamp: false },
  } satisfies FooterBlockData,
}

export const DOCUMENT_TYPES = [
  'ใบเสนอราคา',
  'ใบแจ้งหนี้',
  'ใบเสร็จรับเงิน',
  'ใบวางบิล',
  'ใบกำกับภาษี',
]
