import type { TableBlockData, SummaryBlockData } from '../types/block'

export function calcRowTotal(row: TableBlockData['rows'][0]): number {
  const base = row.quantity * row.unitPrice
  return base * (1 - row.discount / 100)
}

export function calcSubtotal(rows: TableBlockData['rows']): number {
  return rows.reduce((sum, row) => sum + calcRowTotal(row), 0)
}

export function calcSummary(
  rows: TableBlockData['rows'],
  summary: SummaryBlockData
): { subtotal: number; afterDiscount: number; vatAmount: number; total: number } {
  const subtotal = calcSubtotal(rows)
  const afterDiscount = Math.max(0, subtotal - (summary.visibleFields.discount ? summary.discountAmount : 0))
  const vatAmount = summary.visibleFields.vat ? afterDiscount * (summary.vatRate / 100) : 0
  const total = afterDiscount + vatAmount
  return { subtotal, afterDiscount, vatAmount, total }
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// แปลงตัวเลขเป็นข้อความภาษาไทย
const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const tens = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ']

function threeDigitsToThai(n: number): string {
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  let result = ''
  if (h > 0) result += ones[h] + 'ร้อย'
  if (t > 0) result += tens[t]
  if (t === 1 && o > 0) result += ones[o]
  else if (t !== 1 && o > 0) result += ones[o]
  return result
}

export function numberToThaiText(amount: number): string {
  if (amount === 0) return 'ศูนย์บาทถ้วน'
  const baht = Math.floor(amount)
  const satang = Math.round((amount - baht) * 100)

  const units = ['', 'พัน', 'ล้าน']
  const parts: string[] = []
  let n = baht

  if (n >= 1000000) {
    parts.unshift(threeDigitsToThai(n % 1000) + (n % 1000 > 0 ? '' : ''))
    n = Math.floor(n / 1000)
    parts.unshift(threeDigitsToThai(n % 1000) + 'พัน')
    n = Math.floor(n / 1000)
    if (n > 0) parts.unshift(threeDigitsToThai(n) + 'ล้าน')
  } else if (n >= 1000) {
    parts.unshift(threeDigitsToThai(n % 1000))
    n = Math.floor(n / 1000)
    parts.unshift(threeDigitsToThai(n) + 'พัน')
  } else {
    parts.push(threeDigitsToThai(n))
  }

  void units
  let result = parts.join('') + 'บาท'
  if (satang > 0) result += threeDigitsToThai(satang) + 'สตางค์'
  else result += 'ถ้วน'
  return result
}
