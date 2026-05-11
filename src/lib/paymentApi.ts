import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'transfer' | 'cheque' | 'other'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
  cheque: 'เช็ค',
  other: 'อื่นๆ',
}

export interface PaymentRow {
  id: string
  document_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
  wht_rate: number
  wht_amount: number
  note: string
  created_at: string
}

export interface CreatePaymentInput {
  document_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
  wht_rate: number
  wht_amount: number
  note: string
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listPayments(documentId: string): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('document_id', documentId)
    .order('paid_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentRow[]
}

export async function createPayment(
  userId: string,
  input: CreatePaymentInput,
): Promise<PaymentRow> {
  const { data, error } = await supabase
    .from('payments')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as PaymentRow
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Total amount already paid for a document */
export async function getPaidAmount(documentId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_paid_amount', { p_document_id: documentId })
  if (error) throw new Error(error.message)
  return Number(data ?? 0)
}
