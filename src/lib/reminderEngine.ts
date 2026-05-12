import type { DashboardDoc } from '../types/dashboard'

export interface OverdueInvoice {
  id: string
  docNumber: string
  customerName: string
  totalAmount: number
  invoiceDate: string
  dueDate: Date
  daysOverdue: number
  status: 'overdue' | 'due_soon'
}

function parseCreditDays(credit: string): number {
  const match = credit.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 30
}

function getDocNumber(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'docMeta' in content) {
    const meta = (content as { docMeta?: { number?: unknown } }).docMeta
    if (meta && typeof meta.number === 'string') return meta.number
  }
  return ''
}

function getCustomerName(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'customer' in content) {
    const c = (content as { customer?: { name?: unknown } }).customer
    if (c && typeof c.name === 'string' && c.name.trim()) return c.name
  }
  return '—'
}

function getCreditFromContent(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'docMeta' in content) {
    const meta = (content as { docMeta?: { credit?: unknown } }).docMeta
    if (meta && typeof meta.credit === 'string') return meta.credit
  }
  return '30 วัน'
}

export function computeOverdueInvoices(docs: DashboardDoc[]): OverdueInvoice[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return docs
    .filter(d => d.doc_type === 'invoice' && d.status === 'sent')
    .map(d => {
      const credit = getCreditFromContent(d.content)
      const creditDays = parseCreditDays(credit)
      const invoiceDate = new Date(d.created_at)
      invoiceDate.setHours(0, 0, 0, 0)
      const dueDate = new Date(invoiceDate.getTime() + creditDays * 86_400_000)
      const diffMs = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / 86_400_000)

      if (diffDays < 0) {
        return {
          id: d.id,
          docNumber: getDocNumber(d.content),
          customerName: getCustomerName(d.content),
          totalAmount: d.total_amount,
          invoiceDate: d.created_at,
          dueDate,
          daysOverdue: Math.abs(diffDays),
          status: 'overdue' as const,
        }
      }
      if (diffDays <= 7) {
        return {
          id: d.id,
          docNumber: getDocNumber(d.content),
          customerName: getCustomerName(d.content),
          totalAmount: d.total_amount,
          invoiceDate: d.created_at,
          dueDate,
          daysOverdue: diffDays,
          status: 'due_soon' as const,
        }
      }
      return null
    })
    .filter((x): x is OverdueInvoice => x !== null)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
}

export function buildReminderMessage(invoice: OverdueInvoice): string {
  const dateStr = invoice.dueDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  const amountStr = invoice.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `เรียน คุณ/บริษัท ${invoice.customerName}\n\nขอแจ้งเตือนใบแจ้งหนี้เลขที่ ${invoice.docNumber}\nยอดชำระ ฿${amountStr}\nครบกำหนดชำระ ${dateStr}\n\nกรุณาชำระเงินภายในกำหนด หากมีข้อสงสัยกรุณาติดต่อเรา\n\nขอบคุณครับ/ค่ะ`
}
