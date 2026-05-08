export type Plan = 'free' | 'pro' | 'business'

export interface PlanLimits {
  docsPerMonth: number
  customers: number
  products: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:     { docsPerMonth: 20, customers: 10,       products: 10 },
  pro:      { docsPerMonth: Infinity, customers: Infinity, products: Infinity },
  business: { docsPerMonth: Infinity, customers: Infinity, products: Infinity },
}

export const PLAN_LABELS: Record<Plan, string> = {
  free:     'Free',
  pro:      'Pro',
  business: 'Business',
}

export class PlanLimitError extends Error {
  resource: 'documents' | 'customers' | 'products'
  limit: number

  constructor(resource: 'documents' | 'customers' | 'products', limit: number) {
    super(`PLAN_LIMIT:${resource}:${limit}`)
    this.name = 'PlanLimitError'
    this.resource = resource
    this.limit = limit
  }
}
