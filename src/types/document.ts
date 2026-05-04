// ============================================================
// Document Data Types — Bill Block App (v3)
// ใช้ unified DocumentData แทน array of blocks
// ============================================================

export interface LineItem {
  id: string
  description: string
  detail: string        // รายละเอียดย่อย (แสดงใต้ description)
  quantity: number
  unit: string
  unitPrice: number
  discount: number      // ส่วนลด % ต่อแถว
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
    credit: string         // เงื่อนไขเครดิต เช่น "30 วัน"
    salesperson: string
    projectName: string    // ชื่องาน
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
    vatRate: number
  }

  footer: {
    sellerLabel: string     // "ในนาม บริษัท..."
    approverName: string
    approverTitle: string
    buyerLabel: string      // "ในนาม ลูกค้า"
    signatureUrl?: string
    stampUrl?: string
    signatureDate: string
    bankName: string
    accountName: string
    accountNumber: string
  }

  visibility: {
    header: {
      address: boolean
      phone: boolean
      email: boolean
      taxId: boolean
    }
    docMeta: {
      credit: boolean
      salesperson: boolean
      projectName: boolean
    }
    customer: {
      taxId: boolean
      branch: boolean
    }
    table: {
      no: boolean
      unit: boolean
      discount: boolean
    }
    summary: {
      thaiText: boolean
      specialDiscount: boolean
      vat: boolean
      notes: boolean
    }
    footer: {
      bankInfo: boolean
      buyerSignature: boolean
      stamp: boolean
    }
  }
}

export const DOCUMENT_TYPES = [
  'ใบเสนอราคา',
  'ใบแจ้งหนี้',
  'ใบเสร็จรับเงิน',
  'ใบวางบิล',
  'ใบกำกับภาษี',
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
  customer: {
    name: 'ชื่อลูกค้า / บริษัท',
    taxId: '',
    address: 'ที่อยู่ลูกค้า',
    branch: '',
  },
  items: [
    { id: '1', description: 'รายการสินค้า/บริการ', detail: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, discount: 0 },
  ],
  notes: '',
  summary: {
    specialDiscount: 0,
    vatRate: 7,
  },
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
  visibility: {
    header: { address: true, phone: true, email: false, taxId: true },
    docMeta: { credit: true, salesperson: false, projectName: false },
    customer: { taxId: false, branch: false },
    table: { no: true, unit: true, discount: false },
    summary: { thaiText: true, specialDiscount: false, vat: true, notes: true },
    footer: { bankInfo: false, buyerSignature: true, stamp: false },
  },
}
