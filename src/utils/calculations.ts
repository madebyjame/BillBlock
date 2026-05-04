import type { LineItem, DocumentData } from '../types/document'

export function calcItemTotal(item: LineItem): number {
  return item.quantity * item.unitPrice * (1 - item.discount / 100)
}

export function calcSubtotal(items: LineItem[]): number {
  return items.reduce((s, i) => s + calcItemTotal(i), 0)
}

export function calcDocSummary(doc: DocumentData) {
  const subtotal = calcSubtotal(doc.items)
  const specialDiscount = doc.visibility.summary.specialDiscount ? doc.summary.specialDiscount : 0
  const afterDiscount = Math.max(0, subtotal - specialDiscount)
  const vatAmount = doc.visibility.summary.vat ? afterDiscount * (doc.summary.vatRate / 100) : 0
  const total = afterDiscount + vatAmount
  return { subtotal, specialDiscount, afterDiscount, vatAmount, total }
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── แปลงตัวเลขเป็นคำอ่านภาษาไทย ───
const ONES = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const TENS = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ']

function threeDigits(n: number): string {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10
  return (h ? ONES[h] + 'ร้อย' : '') + (t ? TENS[t] : '') + (t === 1 && o === 1 ? 'เอ็ด' : o ? ONES[o] : '')
}

export function numberToThaiText(amount: number): string {
  if (amount === 0) return 'ศูนย์บาทถ้วน'
  const baht = Math.floor(Math.abs(amount))
  const satang = Math.round((Math.abs(amount) - baht) * 100)

  let n = baht
  let result = ''
  const units = ['', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  const parts: string[] = []

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000)
    parts.push(threeDigits(millions) + 'ล้าน')
    n %= 1000000
  }

  const remaining = [100000, 10000, 1000, 100, 10, 1]
  const remainUnits = ['แสน', 'หมื่น', 'พัน', 'ร้อย', 'สิบ', '']
  void remaining; void remainUnits; void units

  // คำนวณส่วนที่เหลือหลังล้าน
  if (n > 0) parts.push(threeDigits(n % 1000))
  const thousands = Math.floor(n / 1000)
  if (thousands > 0) {
    parts[parts.length - 1] = threeDigits(thousands) + 'พัน' + parts[parts.length - 1]
  }

  result = parts.join('') + 'บาท'
  if (satang > 0) result += threeDigits(satang) + 'สตางค์'
  else result += 'ถ้วน'
  return (amount < 0 ? 'ลบ' : '') + result
}
