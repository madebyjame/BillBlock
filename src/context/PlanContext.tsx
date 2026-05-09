import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLAN_LIMITS } from '../lib/planLimits'
import type { Plan } from '../lib/planLimits'
import { useAuth } from './AuthContext'

export interface PlanUsage {
  docsThisMonth: number
  totalCustomers: number
  totalProducts: number
}

interface PlanContextValue {
  plan: Plan
  isPro: boolean
  isBusiness: boolean
  limits: typeof PLAN_LIMITS[Plan]
  usage: PlanUsage
  loading: boolean
  refresh: () => void
}

const DEFAULT_USAGE: PlanUsage = { docsThisMonth: 0, totalCustomers: 0, totalProducts: 0 }

export const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan>('free')
  const [usage, setUsage] = useState<PlanUsage>(DEFAULT_USAGE)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)

    // UTC start of current month — consistent with Supabase UTC storage
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

    try {
      const [planRes, docsRes, customersRes, productsRes] = await Promise.all([
        supabase.rpc('get_user_plan', { uid: user.id }),
        supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      if (!mountedRef.current) return

      setPlan((planRes.data as Plan) ?? 'free')
      setUsage({
        docsThisMonth: docsRes.count ?? 0,
        totalCustomers: customersRes.count ?? 0,
        totalProducts:  productsRes.count ?? 0,
      })
    } catch {
      // plan stays 'free' on error — safe default
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [user])

  useEffect(() => {
    mountedRef.current = true
    void load()
    return () => { mountedRef.current = false }
  }, [load])

  const limits = PLAN_LIMITS[plan]

  return (
    <PlanContext.Provider value={{
      plan,
      isPro:      plan === 'pro' || plan === 'business',
      isBusiness: plan === 'business',
      limits,
      usage,
      loading,
      refresh: () => void load(),
    }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanContext(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlanContext must be used inside <PlanProvider>')
  return ctx
}
