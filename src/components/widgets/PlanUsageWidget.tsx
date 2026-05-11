import { usePlan } from '../../hooks/usePlan'
import { PLAN_LIMITS } from '../../lib/planLimits'

export default function PlanUsageWidget() {
  const { plan, usage, limits, loading } = usePlan()

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3 p-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">การใช้งานแพ็กเกจ</p>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (plan !== 'free') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center p-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          plan === 'pro' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
        }`}>
          {plan === 'pro' ? 'Pro' : 'Business'}
        </span>
        <p className="text-sm font-semibold text-slate-700">ไม่จำกัดการใช้งาน</p>
        <p className="text-xs text-slate-400">เอกสาร / ลูกค้า / สินค้า ไม่จำกัด</p>
      </div>
    )
  }

  const freeLimits = PLAN_LIMITS['free']

  const bars: { label: string; used: number; max: number }[] = [
    { label: 'เอกสาร/เดือน', used: usage.docsThisMonth, max: freeLimits.docsPerMonth },
    { label: 'ลูกค้า', used: usage.totalCustomers, max: freeLimits.customers },
    { label: 'สินค้า', used: usage.totalProducts, max: freeLimits.products },
  ]

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">การใช้งานแพ็กเกจ</p>
      <div className="flex flex-col gap-3 flex-1">
        {bars.map(bar => {
          const pct = Math.min((bar.used / bar.max) * 100, 100)
          const isNearLimit = pct >= 80
          return (
            <div key={bar.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-600">{bar.label}</span>
                <span className={`text-xs font-medium ${isNearLimit ? 'text-orange-600' : 'text-slate-500'}`}>
                  {bar.used}/{bar.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isNearLimit ? 'bg-orange-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-slate-400">
        แพ็กเกจ Free &middot; <a href="/settings" className="text-blue-500 hover:underline">อัปเกรด</a>
      </p>
    </div>
  )
}
