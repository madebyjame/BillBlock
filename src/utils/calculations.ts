import type { LineItem, DocumentData } from '../types/document'

export function calcItemTotal(item: LineItem): number {
  const base = item.quantity * item.unitPrice
  if (item.discountType === 'percent') {
    return base * (1 - item.discount / 100)
  }
  // 'amount': ส่วนลดเป็นบาทต่อรายการ
  return Math.max(0, base - item.discount)
}

export function calcSubtotal(items: LineItem[]): number {
  return items.reduce((s, i) => s + calcItemTotal(i), 0)
}

export function calcDocSummary(doc: DocumentData) {
  const subtotal = calcSubtotal(doc.items)
  const vatRate = doc.summary.vatRate
  const vatMode = doc.settings.vatMode

  // ส่วนลดพิเศษ
  let specialDiscountAmt = 0
  if (doc.visibility.summary.specialDiscount) {
    if (doc.summary.specialDiscountType === 'percent') {
      specialDiscountAmt = subtotal * (doc.summary.specialDiscount / 100)
    } else {
      specialDiscountAmt = doc.summary.specialDiscount
    }
  }

  const afterDiscount = Math.max(0, subtotal - specialDiscountAmt)

  let vatAmount = 0
  let preTaxAmount = afterDiscount
  let total = afterDiscount

  if (doc.visibility.summary.vat) {
    if (vatMode === 'exclusive') {
      // ราคาแยก VAT: total = afterDiscount + VAT
      vatAmount = afterDiscount * (vatRate / 100)
      total = afterDiscount + vatAmount
      preTaxAmount = afterDiscount
    } else {
      // ราคารวม VAT แล้ว: VAT ถูกรวมอยู่ในราคาแล้ว
      vatAmount = afterDiscount * vatRate / (100 + vatRate)
      preTaxAmount = afterDiscount - vatAmount
      total = afterDiscount  // total เท่ากับ afterDiscount (ราคาที่รวม VAT แล้ว)
    }
  }

  return { subtotal, specialDiscountAmt, afterDiscount, vatAmount, preTaxAmount, total }
}

export function formatCurrency(n: number, symbol = '฿'): string {
  return `${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`
}

export function formatNumber(n: number): string {
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
  return (h ? ONES[h] + 'ร้อย' : '') +
    (t ? TENS[t] : '') +
    (t === 1 && o === 1 ? 'เอ็ด' : o ? ONES[o] : '')
}

export function numberToThaiText(amount: number): string {
  if (amount === 0) return 'ศูนย์บาทถ้วน'
  const baht = Math.floor(Math.abs(amount))
  const satang = Math.round((Math.abs(amount) - baht) * 100)
  const parts: string[] = []
  const millions = Math.floor(baht / 1000000)
  const remainder = baht % 1000000
  const thousands = Math.floor(remainder / 1000)
  const hundreds = remainder % 1000
  if (millions) parts.push(threeDigits(millions) + 'ล้าน')
  if (thousands) parts.push(threeDigits(thousands) + 'พัน')
  if (hundreds) parts.push(threeDigits(hundreds))
  let result = parts.join('') + 'บาท'
  result += satang ? threeDigits(satang) + 'สตางค์' : 'ถ้วน'
  return (amount < 0 ? 'ลบ' : '') + result
}
