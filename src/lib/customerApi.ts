import { supabase } from './supabase'
import { PLAN_LIMITS, PlanLimitError } from './planLimits'
import type { Plan } from './planLimits'

export interface CustomerRow {
  id: string
  user_id: string
  name: string
  address: string
  tax_id: string
  email: string
  phone: string
  created_at?: string
  updated_at?: string
}

export interface CustomerInput {
  name: string
  address: string
  tax_id: string
  email: string
  phone: string
}

export async function listCustomers(): Promise<CustomerRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('customers')
    .select('id, user_id, name, address, tax_id, email, phone, created_at, updated_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CustomerRow[]
}

export async function createCustomer(userId: string, input: CustomerInput): Promise<void> {
  const { data: planData } = await supabase.rpc('get_user_plan', { uid: userId })
  const plan = (planData as Plan) ?? 'free'
  const limit = PLAN_LIMITS[plan].customers
  if (isFinite(limit)) {
    const { count } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if ((count ?? 0) >= limit) throw new PlanLimitError('customers', limit)
  }

  const { error } = await supabase
    .from('customers')
    .insert({ user_id: userId, ...input })
  if (error) throw new Error(error.message)
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
