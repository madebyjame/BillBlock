import { describe, expect, it } from 'vitest'
import type { DocumentData } from '../types/document'
import { defaultDocument } from '../types/document'
import { normalizeDocumentDraft, stripEphemeralBlobUrls } from './documentDraft'

describe('normalizeDocumentDraft', () => {
  it('เติมค่าเริ่มต้นเมื่อข้อมูลไม่ครบ', () => {
    const merged = normalizeDocumentDraft({
      docMeta: { number: 'INV-99', date: '2026-01-01', documentType: 'ใบแจ้งหนี้', credit: '', salesperson: '', projectName: '' },
    })
    expect(merged.docMeta.number).toBe('INV-99')
    expect(merged.company.name).toBe(defaultDocument.company.name)
    expect(merged.visibility.header.address).toBe(defaultDocument.visibility.header.address)
  })

  it('รวม visibility ซ้อนได้ลึก', () => {
    const merged = normalizeDocumentDraft({
      visibility: { header: { email: true } },
    } as Partial<DocumentData>)
    expect(merged.visibility.header.email).toBe(true)
    expect(merged.visibility.header.address).toBe(defaultDocument.visibility.header.address)
  })
})

describe('stripEphemeralBlobUrls', () => {
  it('ตัด blob URL ออกจากโลโก้และลายเซ็น', () => {
    const doc = structuredClone(defaultDocument)
    doc.company.logoUrl = 'blob:http://localhost/abc'
    doc.footer.signatureUrl = 'blob:http://localhost/def'
    doc.footer.stampUrl = 'blob:http://localhost/ghi'
    const out = stripEphemeralBlobUrls(doc)
    expect(out.company.logoUrl).toBeUndefined()
    expect(out.footer.signatureUrl).toBeUndefined()
    expect(out.footer.stampUrl).toBeUndefined()
  })

  it('เก็บ data URL ไว้', () => {
    const doc = structuredClone(defaultDocument)
    const data = 'data:image/png;base64,AAAA'
    doc.company.logoUrl = data
    const out = stripEphemeralBlobUrls(doc)
    expect(out.company.logoUrl).toBe(data)
  })
})
