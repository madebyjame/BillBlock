import { describe, expect, it } from 'vitest'
import { defaultDocument } from '../types/document'
import { validateDocumentForExport } from './validateExport'

describe('validateDocumentForExport', () => {
  it('ผ่านเมื่อข้อมูลครบจากค่าเริ่มต้น', () => {
    const { ok, messages } = validateDocumentForExport(defaultDocument)
    expect(ok).toBe(true)
    expect(messages).toHaveLength(0)
  })

  it('ไม่ผ่านเมื่อฟิลด์สำคัญว่าง', () => {
    const doc = structuredClone(defaultDocument)
    doc.company.name = ''
    doc.customer.name = ' '
    doc.docMeta.number = ''
    doc.docMeta.date = ''
    doc.items = [{ ...doc.items[0], description: '' }]
    const { ok, messages } = validateDocumentForExport(doc)
    expect(ok).toBe(false)
    expect(messages.length).toBeGreaterThan(0)
    expect(messages.some(m => m.includes('บริษัท'))).toBe(true)
    expect(messages.some(m => m.includes('ลูกค้า'))).toBe(true)
    expect(messages.some(m => m.includes('เลขที่'))).toBe(true)
    expect(messages.some(m => m.includes('วันที่'))).toBe(true)
    expect(messages.some(m => m.includes('รายการ'))).toBe(true)
  })
})
