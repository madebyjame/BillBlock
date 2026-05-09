import { supabase } from './supabase'

export type Plan = 'free' | 'pro' | 'business'

export interface PlanLimits {
  docsPerMonth: number
  customers: number
  products: number
  signatures: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:     { docsPerMonth: 20,       customers: 10,       products: 10,       signatures: 1 },
  pro:      { docsPerMonth: Infinity, customers: Infinity, products: Infinity, signatures: 5 },
  business: { docsPerMonth: Infinity, customers: Infinity, products: Infinity, signatures: Infinity },
}

export const PLAN_LABELS: Record<Plan, string> = {
  free:     'Free',
  pro:      'Pro',
  business: 'Max',
}

export const PLAN_PRICES: Record<Plan, { thb: number; label: string }> = {
  free:     { thb: 0,   label: 'ฟรี' },
  pro:      { thb: 299, label: '฿299/เดือน' },
  business: { thb: 599, label: '฿599/เดือน' },
}

export class PlanLimitError extends Error {
  resource: 'documents' | 'customers' | 'products' | 'signatures'
  limit: number

  constructor(resource: 'documents' | 'customers' | 'products' | 'signatures', limit: number) {
    super(`PLAN_LIMIT:${resource}:${limit}`)
    this.name = 'PlanLimitError'
    this.resource = resource
    this.limit = limit
  }
}

// ─── Shared plan-limit enforcement ───────────────────────────────────────────
export async function checkPlanLimit(
  userId: string,
  resource: 'documents' | 'customers' | 'products',
): Promise<void> {
  const { data: planData } = await supabase.rpc('get_user_plan', { uid: userId })
  const plan = (planData as Plan) ?? 'free'

  const limitValue =
    resource === 'documents'
      ? PLAN_LIMITS[plan].docsPerMonth
      : resource === 'customers'
        ? PLAN_LIMITS[plan].customers
        : PLAN_LIMITS[plan].products

  if (!isFinite(limitValue)) return

  let query = supabase
    .from(resource === 'documents' ? 'documents' : resource === 'customers' ? 'customers' : 'products')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (resource === 'documents') {
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    query = query.gte('created_at', startOfMonth.toISOString())
  }

  const { count } = await query
  if ((count ?? 0) >= limitValue) throw new PlanLimitError(resource, limitValue)
}
