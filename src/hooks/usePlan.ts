import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLAN_LIMITS } from '../lib/planLimits'
import type { Plan } from '../lib/planLimits'
import { useAuth } from '../context/AuthContext'

export interface PlanUsage {
  docsThisMonth: number
  totalCustomers: number
  totalProducts: number
}

export interface UsePlanResult {
  plan: Plan
  isPro: boolean
  isBusiness: boolean
  limits: typeof PLAN_LIMITS[Plan]
  usage: PlanUsage
  loading: boolean
}

const DEFAULT_USAGE: PlanUsage = { docsThisMonth: 0, totalCustomers: 0, totalProducts: 0 }

export function usePlan(): UsePlanResult {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan>('free')
  const [usage, setUsage] = useState<PlanUsage>(DEFAULT_USAGE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      setLoading(true)
      try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const [planRes, docsRes, customersRes, productsRes] = await Promise.all([
          supabase.rpc('get_user_plan', { uid: user!.id }),
          supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id)
            .gte('created_at', startOfMonth.toISOString()),
          supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id),
        ])

        setPlan((planRes.data as Plan) ?? 'free')
        setUsage({
          docsThisMonth: docsRes.count ?? 0,
          totalCustomers: customersRes.count ?? 0,
          totalProducts:  productsRes.count ?? 0,
        })
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user])

  const limits = PLAN_LIMITS[plan]

  return {
    plan,
    isPro:      plan === 'pro' || plan === 'business',
    isBusiness: plan === 'business',
    limits,
    usage,
    loading,
  }
}
