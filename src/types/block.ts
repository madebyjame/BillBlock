// ============================================================
// Block Types สำหรับ Bill Block App
// แต่ละ Block มี id, type, และ data ที่แตกต่างกันตามประเภท
// ============================================================

/** ประเภทของ Block ทั้งหมด */
export type BlockType = 'header' | 'info' | 'table' | 'text' | 'footer'

// ─────────────────────────────────────────
// Header Block — โลโก้ + ชื่อบริษัท + ที่อยู่
// ─────────────────────────────────────────
export interface HeaderBlockData {
  companyName: string
  address: string
  phone: string
  email: string
  logoUrl?: string
}

// ─────────────────────────────────────────
// Info Block — เลขที่เอกสาร, วันที่, ลูกค้า (2 คอลัมน์)
// ─────────────────────────────────────────
export interface InfoBlockData {
  documentType: string        // เช่น "ใบเสนอราคา" | "ใบแจ้งหนี้"
  documentNumber: string
  documentDate: string        // ISO string เช่น "2025-01-15"
  dueDate?: string
  customerName: string
  customerAddress: string
  customerPhone?: string
  customerTaxId?: string
}

// ─────────────────────────────────────────
// Table Block — รายการสินค้า + คำนวณภาษี
// ─────────────────────────────────────────
export interface TableRow {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  // total คำนวณจาก quantity * unitPrice (ไม่เก็บใน state)
}

export interface TableBlockData {
  rows: TableRow[]
  vatRate: number             // % VAT เช่น 7 (สำหรับ 7%)
  includeVat: boolean         // รวม VAT หรือไม่
  discountAmount: number      // ส่วนลดเป็นบาท
}

// ─────────────────────────────────────────
// Text Block — หมายเหตุ / ข้อความอิสระ
// ─────────────────────────────────────────
export interface TextBlockData {
  title?: string              // หัวข้อ เช่น "หมายเหตุ"
  content: string
}

// ─────────────────────────────────────────
// Footer Block — บัญชีธนาคาร + ลายเซ็น
// ─────────────────────────────────────────
export interface FooterBlockData {
  bankName?: string
  accountName?: string
  accountNumber?: string
  signerName?: string
  signerTitle?: string
  note?: string
}

// ─────────────────────────────────────────
// Union Type สำหรับ Block ทั้งหมด
// ใช้ Discriminated Union เพื่อให้ TypeScript ช่วย type-check
// ─────────────────────────────────────────
export type Block =
  | { id: string; type: 'header'; data: HeaderBlockData }
  | { id: string; type: 'info';   data: InfoBlockData }
  | { id: string; type: 'table';  data: TableBlockData }
  | { id: string; type: 'text';   data: TextBlockData }
  | { id: string; type: 'footer'; data: FooterBlockData }

// ─────────────────────────────────────────
// Helper: ค่า default สำหรับ Block ใหม่แต่ละประเภท
// ─────────────────────────────────────────
export const defaultBlockData: Record<BlockType, Block['data']> = {
  header: {
    companyName: 'ชื่อบริษัทของคุณ',
    address: 'ที่อยู่บริษัท',
    phone: '02-xxx-xxxx',
    email: 'email@company.com',
  } satisfies HeaderBlockData,

  info: {
    documentType: 'ใบเสนอราคา',
    documentNumber: 'QT-2025-001',
    documentDate: new Date().toISOString().split('T')[0],
    customerName: 'ชื่อลูกค้า',
    customerAddress: 'ที่อยู่ลูกค้า',
  } satisfies InfoBlockData,

  table: {
    rows: [
      { id: '1', description: 'รายการสินค้า/บริการ', quantity: 1, unit: 'ชิ้น', unitPrice: 0 },
    ],
    vatRate: 7,
    includeVat: true,
    discountAmount: 0,
  } satisfies TableBlockData,

  text: {
    title: 'หมายเหตุ',
    content: 'ระบุหมายเหตุหรือเงื่อนไขที่นี่',
  } satisfies TextBlockData,

  footer: {
    bankName: 'ธนาคาร',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'xxx-x-xxxxx-x',
    signerName: 'ชื่อผู้มีอำนาจ',
    signerTitle: 'ผู้จัดการ',
  } satisfies FooterBlockData,
}
