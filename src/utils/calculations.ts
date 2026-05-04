import type { TableBlockData } from '../types/block'

/** คำนวณ subtotal (ก่อนหักส่วนลดและ VAT) */
export function calcSubtotal(rows: TableBlockData['rows']): number {
  return rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0)
}

/** คำนวณยอดหลังหักส่วนลด */
export function calcAfterDiscount(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount)
}

/** คำนวณ VAT */
export function calcVat(afterDiscount: number, vatRate: number): number {
  return afterDiscount * (vatRate / 100)
}

/** คำนวณยอดรวมทั้งหมด */
export function calcTotal(data: TableBlockData): {
  subtotal: number
  afterDiscount: number
  vatAmount: number
  total: number
} {
  const subtotal = calcSubtotal(data.rows)
  const afterDiscount = calcAfterDiscount(subtotal, data.discountAmount)
  const vatAmount = data.includeVat ? calcVat(afterDiscount, data.vatRate) : 0
  const total = afterDiscount + vatAmount

  return { subtotal, afterDiscount, vatAmount, total }
}

/** Format ตัวเลขเป็น string แบบไทย เช่น 1,234.56 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Format วันที่ ISO string เป็น DD/MM/YYYY */
export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
