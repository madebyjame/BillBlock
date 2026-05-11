import { supabase } from './supabase'

export type Plan = 'free' | 'pro' | 'business'

export interface PlanLimits {
  docsPerMonth: number
  customers: number
  products: number
  signatures: number
}

// ─── Tier definitions ─────────────────────────────────────────────────────────
// Security note: checkPlanLimit calls get_user_plan RPC (server-side) then counts
// rows via Supabase with RLS applied. True write-time enforcement would require
// a PostgreSQL trigger — recommended as future hardening.

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:     { docsPerMonth: 5,        customers: 5,        products: 5,        signatures: 1        },
  pro:      { docsPerMonth: 100,      customers: 50,       products: 50,       signatures: 5        },
  business: { docsPerMonth: Infinity, customers: Infinity, products: Infinity, signatures: Infinity },
}

export const PLAN_LABELS: Record<Plan, string> = {
  free:     'Free',
  pro:      'Pro',
  business: 'Business',
}

/** Monthly prices in THB; annual = discounted per-month rate */
export const PLAN_PRICES: Record<Plan, { monthly: number; annual: number }> = {
  free:     { monthly: 0,   annual: 0   },
  pro:      { monthly: 149, annual: 127 },  // ≈ 15% off
  business: { monthly: 450, annual: 360 },  // 20% off
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

// ─── Server-side usage check (called before every insert) ─────────────────────
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
