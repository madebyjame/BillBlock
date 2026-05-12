import type { DashboardDoc } from '../types/dashboard'

export interface CashFlowBucket {
  label: string
  amount: number
  count: number
  color: string
}

export interface CashFlowData {
  buckets: CashFlowBucket[]
  totalExpected: number
}

function parseCreditDays(content: unknown): number {
  if (content !== null && typeof content === 'object' && 'docMeta' in content) {
    const meta = (content as { docMeta?: { credit?: unknown } }).docMeta
    if (meta && typeof meta.credit === 'string') {
      const match = meta.credit.match(/(\d+)/)
      if (match) return parseInt(match[1], 10)
    }
  }
  return 30
}

export function computeCashFlow(docs: DashboardDoc[]): CashFlowData {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const buckets: CashFlowBucket[] = [
    { label: 'เกินกำหนด',      amount: 0, count: 0, color: '#ef4444' },
    { label: 'สัปดาห์นี้',     amount: 0, count: 0, color: '#f97316' },
    { label: '8–30 วัน',       amount: 0, count: 0, color: '#eab308' },
    { label: '31–90 วัน',      amount: 0, count: 0, color: '#22c55e' },
  ]

  const pending = docs.filter(d =>
    (d.doc_type === 'invoice' || d.doc_type === 'billing-note') && d.status === 'sent'
  )

  for (const doc of pending) {
    const creditDays = parseCreditDays(doc.content)
    const invoiceDate = new Date(doc.created_at)
    invoiceDate.setHours(0, 0, 0, 0)
    const dueDate = new Date(invoiceDate.getTime() + creditDays * 86_400_000)
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86_400_000)

    if (diffDays < 0) {
      buckets[0].amount += doc.total_amount
      buckets[0].count++
    } else if (diffDays <= 7) {
      buckets[1].amount += doc.total_amount
      buckets[1].count++
    } else if (diffDays <= 30) {
      buckets[2].amount += doc.total_amount
      buckets[2].count++
    } else if (diffDays <= 90) {
      buckets[3].amount += doc.total_amount
      buckets[3].count++
    }
  }

  return {
    buckets,
    totalExpected: buckets.reduce((s, b) => s + b.amount, 0),
  }
}
