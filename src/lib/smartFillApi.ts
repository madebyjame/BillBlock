import { supabase } from './supabase'
import type { LineItem } from '../types/document'

export interface LastDocSummary {
  id: string
  doc_type: string
  created_at: string
  total_amount: number
  items: LineItem[]
  docNumber: string
}

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation: 'ใบเสนอราคา',
  invoice: 'ใบแจ้งหนี้',
  receipt: 'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice': 'ใบกำกับภาษี',
}

export function docTypeLabel(type: string): string {
  return DOC_TYPE_LABEL[type] ?? type
}

export async function getLastDocByCustomer(customerName: string): Promise<LastDocSummary | null> {
  if (!customerName.trim()) return null

  const { data, error } = await supabase
    .from('documents')
    .select('id, doc_type, created_at, total_amount, content')
    .filter('content->customer->>name', 'ilike', customerName.trim())
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null

  const row = data[0]
  const content = row.content as Record<string, unknown>

  return {
    id: row.id,
    doc_type: row.doc_type,
    created_at: row.created_at,
    total_amount: row.total_amount,
    items: (content.items as LineItem[] | undefined) ?? [],
    docNumber: (content.docMeta as Record<string, string> | undefined)?.number ?? '',
  }
}
