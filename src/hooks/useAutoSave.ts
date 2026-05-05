import { useEffect, useRef, useState } from 'react'
import type { DocumentData } from '../types/document'

const STORAGE_KEY = 'billblock_draft'
const CATALOG_KEY = 'billblock_catalog'

export interface CatalogEntry {
  description: string
  unit: string
  unitPrice: number
  discountType: 'percent' | 'amount'
}

/** โหลดเอกสารจาก localStorage */
export function loadDraft(): DocumentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** โหลด catalog จาก localStorage */
export function loadCatalog(): CatalogEntry[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** บันทึก catalog (สินค้าที่เคยใช้) */
export function saveCatalog(entries: CatalogEntry[]) {
  try {
    // เก็บไว้สูงสุด 100 รายการ deduplicated
    const unique = Array.from(
      new Map(entries.map(e => [e.description.toLowerCase(), e])).values()
    ).slice(-100)
    localStorage.setItem(CATALOG_KEY, JSON.stringify(unique))
  } catch {
    void 0 /* quota / private mode */
  }
}

/** Hook: auto-save doc ทุกครั้งที่เปลี่ยน + แสดงสถานะ (pass null เพื่อ disable) */
export function useAutoSave(doc: DocumentData | null) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!doc) return
    if (isFirstRender.current) { isFirstRender.current = false; return }

    setStatus('unsaved')
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (!doc) return
      try {
        setStatus('saving')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))

        // อัปเดต catalog จากรายการที่มีชื่อสินค้า
        const existing = loadCatalog()
        const newEntries: CatalogEntry[] = doc.items
          .filter(i => i.description.trim())
          .map(i => ({ description: i.description, unit: i.unit, unitPrice: i.unitPrice, discountType: i.discountType }))
        saveCatalog([...existing, ...newEntries])

        setStatus('saved')
      } catch {
        setStatus('unsaved')
      }
    }, 800)

    return () => clearTimeout(timerRef.current)
  }, [doc])

  return status
}
