import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import type { DocTypeCode } from '../types/document'
import { DOC_TYPE_CODES } from '../types/document'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportRow {
  เลขที่เอกสาร: string
  ประเภท: string
  วันที่: string
  วันครบกำหนด: string
  ชื่อลูกค้า: string
  สถานะ: string
  'ยอดก่อน VAT (฿)': number
  'VAT 7% (฿)': number
  'WHT (฿)': number
  'ยอดสุทธิ (฿)': number
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function safeNum(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function extractContent(raw: unknown) {
  const c = (raw ?? {}) as Record<string, unknown>
  const docMeta = (c.docMeta ?? {}) as Record<string, unknown>
  const customer = (c.customer ?? {}) as Record<string, unknown>
  const summary = (c.summary ?? {}) as Record<string, unknown>
  return { docMeta, customer, summary }
}

// ─── Export documents list ────────────────────────────────────────────────────

export async function exportDocumentsToExcel(
  userId: string,
  docType?: DocTypeCode,
  dateFrom?: string,
  dateTo?: string,
): Promise<void> {
  let query = supabase
    .from('documents')
    .select('id, doc_type, status, total_amount, created_at, due_date, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (docType) query = query.eq('doc_type', docType)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows: ExportRow[] = (data ?? []).map((doc) => {
    const { docMeta, customer, summary } = extractContent(doc.content)
    const vatAmount = safeNum(summary.vatAmount)
    const subtotal = safeNum(summary.subtotal)
    const whtAmount = safeNum(summary.whtAmount ?? 0)
    const total = safeNum(summary.total ?? doc.total_amount)

    return {
      เลขที่เอกสาร: String(docMeta.number ?? ''),
      ประเภท: DOC_TYPE_CODES[doc.doc_type as DocTypeCode] ?? doc.doc_type,
      วันที่: doc.created_at ? fmtDate(doc.created_at) : '',
      วันครบกำหนด: doc.due_date ? fmtDate(doc.due_date) : '',
      ชื่อลูกค้า: String(customer.name ?? ''),
      สถานะ: STATUS_LABEL[doc.status] ?? doc.status,
      'ยอดก่อน VAT (฿)': subtotal,
      'VAT 7% (฿)': vatAmount,
      'WHT (฿)': whtAmount,
      'ยอดสุทธิ (฿)': total,
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 16 }, // เลขที่เอกสาร
    { wch: 14 }, // ประเภท
    { wch: 12 }, // วันที่
    { wch: 12 }, // วันครบกำหนด
    { wch: 28 }, // ชื่อลูกค้า
    { wch: 12 }, // สถานะ
    { wch: 14 }, // ยอดก่อน VAT
    { wch: 12 }, // VAT
    { wch: 10 }, // WHT
    { wch: 14 }, // ยอดสุทธิ
  ]

  const wb = XLSX.utils.book_new()
  const sheetName = docType ? (DOC_TYPE_CODES[docType] ?? 'เอกสาร') : 'เอกสารทั้งหมด'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const filename = `billblock_${docType ?? 'documents'}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ─── Export customers list ────────────────────────────────────────────────────

export async function exportCustomersToExcel(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('customers')
    .select('name, contact_person, tax_id, phone, email, status, tags, credit_term, salesperson, address')
    .eq('user_id', userId)
    .order('name')

  if (error) throw new Error(error.message)

  const STATUS: Record<string, string> = {
    active: 'ใช้งาน', inactive: 'ไม่ใช้งาน', vip: 'VIP', blocked: 'ระงับ',
  }

  const rows = (data ?? []).map((r) => ({
    ชื่อลูกค้า: r.name,
    ผู้ติดต่อ: r.contact_person,
    เลขผู้เสียภาษี: r.tax_id,
    โทรศัพท์: r.phone,
    อีเมล: r.email,
    สถานะ: STATUS[r.status] ?? r.status,
    แท็ก: (r.tags as string[]).join(', '),
    เครดิตเทอม: r.credit_term,
    เซลส์: r.salesperson,
    ที่อยู่: r.address,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 36 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ลูกค้า')
  XLSX.writeFile(wb, `billblock_customers_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
