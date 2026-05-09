import { supabase } from './supabase'

export interface PortalDocument {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue'
  total_amount: number
  due_date: string | null
  paid_date: string | null
  created_at: string
  doc_number: string | null
  content: unknown
}

export interface PortalCustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

export interface PortalData {
  customer: PortalCustomer
  documents: PortalDocument[]
  company: { company_name: string | null; logo_url: string | null }
}

export type PortalError = 'invalid_token' | 'token_expired' | 'not_found'

export async function getPortalData(
  token: string,
): Promise<{ data: PortalData } | { error: PortalError }> {
  const { data, error } = await supabase.functions.invoke('get-portal-data', {
    body: { token },
  })

  if (error) return { error: 'not_found' }

  const result = data as { error?: string } & PortalData
  if (result.error === 'invalid_token') return { error: 'invalid_token' }
  if (result.error === 'token_expired') return { error: 'token_expired' }

  return { data: result as PortalData }
}

export interface PaymentCharge {
  charge_id: string
  qr_uri: string | null
  expires_at: string
  amount: number
}

export async function createPayment(
  token: string,
  document_id: string,
  amount: number,
): Promise<{ data: PaymentCharge } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { token, document_id, amount },
  })

  if (error) return { error: error.message }
  const result = data as { error?: string } & PaymentCharge
  if (result.error) return { error: result.error }
  return { data: result as PaymentCharge }
}

export async function checkPayment(
  charge_id: string,
  document_id: string,
  token: string,
): Promise<'pending' | 'successful' | 'failed' | 'expired'> {
  const { data } = await supabase.functions.invoke('check-payment', {
    body: { charge_id, document_id, token },
  })
  type ChargeStatus = 'pending' | 'successful' | 'failed' | 'expired'
  const status = (data as { status?: string } | null)?.status
  const valid: ChargeStatus[] = ['pending', 'successful', 'failed', 'expired']
  return valid.includes(status as ChargeStatus) ? (status as ChargeStatus) : 'pending'
}

// ─── Generate portal token (called by app owner) ──────────────────────────────
export async function generatePortalToken(customerId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Upsert: one active token per customer
  const { data, error } = await supabase
    .from('portal_tokens')
    .upsert(
      { user_id: user.id, customer_id: customerId },
      { onConflict: 'customer_id', ignoreDuplicates: false },
    )
    .select('token')
    .single()

  if (error) throw new Error(error.message)
  return (data as { token: string }).token
}

export function buildPortalUrl(token: string): string {
  return `${window.location.origin}/portal/${token}`
}
