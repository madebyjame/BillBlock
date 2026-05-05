import type { DocumentData, BlockType, DocumentBlock } from '../types/document'
import { defaultDocument } from '../types/document'
import { generateId } from './idGenerator'

/** รวม draft ที่โหลดมากับค่าเริ่มต้น (schema ใหม่ไม่พัง) */
export function normalizeDocumentDraft(raw: Partial<DocumentData> | null | undefined): DocumentData {
  if (!raw) return defaultDocument
  const v = raw.visibility
  return {
    ...defaultDocument,
    ...raw,
    settings: { ...defaultDocument.settings, ...raw.settings },
    visibility: {
      header: { ...defaultDocument.visibility.header, ...v?.header },
      docMeta: { ...defaultDocument.visibility.docMeta, ...v?.docMeta },
      customer: { ...defaultDocument.visibility.customer, ...v?.customer },
      table: { ...defaultDocument.visibility.table, ...v?.table },
      summary: { ...defaultDocument.visibility.summary, ...v?.summary },
      footer: { ...defaultDocument.visibility.footer, ...v?.footer },
    },
    company: { ...defaultDocument.company, ...raw.company },
    docMeta: { ...defaultDocument.docMeta, ...raw.docMeta },
    customer: { ...defaultDocument.customer, ...raw.customer },
    footer: { ...defaultDocument.footer, ...raw.footer },
    summary: { ...defaultDocument.summary, ...raw.summary },
    items: Array.isArray(raw.items) ? raw.items.map(item => ({
      ...defaultDocument.items[0],
      ...item,
      id: item.id || generateId()
    })) : defaultDocument.items,
    blocks: Array.isArray(raw.blocks) ? raw.blocks.map(block => ({
      ...block,
      id: block.id || generateId()
    })) : migrateBlocksFromVisibility(raw),
  }
}

// ถ้า draft เก่าไม่มี blocks ให้สร้างจาก visibility flags
function migrateBlocksFromVisibility(raw: Partial<DocumentData>): DocumentBlock[] {
  const blocks: DocumentBlock[] = []
  if (raw.notes?.trim()) blocks.push({ id: generateId(), type: 'notes' as BlockType })
  blocks.push({ id: 'default-sig', type: 'signature' as BlockType })
  if (raw.visibility?.footer?.bankInfo) blocks.push({ id: generateId(), type: 'bankInfo' as BlockType })
  return blocks
}

/** blob: URL ใช้ซ้ำหลังรีเฟรชไม่ได้ — ตัดทิ้งเพื่อไม่ให้รูปพังและลดโอกาส canvas taint */
export function stripEphemeralBlobUrls(doc: DocumentData): DocumentData {
  const clean = (url?: string): string | undefined => {
    if (!url || url.startsWith('blob:')) return undefined
    return url
  }
  return {
    ...doc,
    company: { ...doc.company, logoUrl: clean(doc.company.logoUrl) },
    footer: {
      ...doc.footer,
      signatureUrl: clean(doc.footer.signatureUrl),
      stampUrl: clean(doc.footer.stampUrl),
    },
  }
}
