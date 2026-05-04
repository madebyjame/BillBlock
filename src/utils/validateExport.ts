import type { DocumentData } from '../types/document'

/** ตรวจก่อน Export PDF — คืนข้อความภาษาไทยสำหรับแจ้งผู้ใช้ */
export function validateDocumentForExport(doc: DocumentData): { ok: boolean; messages: string[] } {
  const messages: string[] = []

  if (!doc.company.name.trim()) messages.push('ชื่อบริษัท / ร้านค้า')
  if (!doc.customer.name.trim()) messages.push('ชื่อลูกค้า / บริษัท')
  if (!doc.docMeta.number.trim()) messages.push('เลขที่เอกสาร')
  if (!doc.docMeta.date.trim()) messages.push('วันที่เอกสาร')

  const hasDescribedLine = doc.items.some(i => i.description.trim().length > 0)
  if (!hasDescribedLine) messages.push('อย่างน้อยหนึ่งรายการที่มีชื่อสินค้าหรือบริการ')

  return { ok: messages.length === 0, messages }
}
