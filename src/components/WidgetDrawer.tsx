import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { WIDGET_REGISTRY, type WidgetId, type WidgetRegistryEntry, type RequiredPlan } from '../types/dashboard'
import type { Plan } from '../lib/planLimits'

interface WidgetDrawerProps {
  open: boolean
  currentLayout: WidgetId[]
  plan: Plan
  onAdd: (id: WidgetId) => void
  onClose: () => void
}

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  business: 2,
}

const REQUIRED_PLAN_RANK: Record<RequiredPlan, number> = {
  free: 0,
  pro: 1,
  business: 2,
}

function canAccess(entry: WidgetRegistryEntry, plan: Plan): boolean {
  return PLAN_RANK[plan] >= REQUIRED_PLAN_RANK[entry.requiredPlan]
}

const TIER_LABELS: Record<RequiredPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
}

const TIER_BADGE_CLASS: Record<RequiredPlan, string> = {
  free:     'bg-slate-100 text-slate-500',
  pro:      'bg-blue-100 text-blue-600',
  business: 'bg-purple-100 text-purple-600',
}

export default function WidgetDrawer({ open, currentLayout, plan, onAdd, onClose }: WidgetDrawerProps) {
  const navigate = useNavigate()
  const currentSet = new Set(currentLayout)

  // Only show widgets not already in layout
  const available = WIDGET_REGISTRY.filter(e => !currentSet.has(e.id))

  const tiers: RequiredPlan[] = ['free', 'pro', 'business']

  function handleCardClick(entry: WidgetRegistryEntry) {
    if (!canAccess(entry, plan)) {
      toast.error(`อัปเกรดเป็น ${TIER_LABELS[entry.requiredPlan]} เพื่อใช้ Widget นี้`)
      navigate('/settings')
      return
    }
    onAdd(entry.id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">เพิ่ม Widget</h2>
                <p className="text-xs text-slate-400 mt-0.5">เลือก Widget ที่ต้องการเพิ่มใน Dashboard</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {available.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <Plus size={20} className="text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Widget ทั้งหมดอยู่ใน Dashboard แล้ว</p>
                  <p className="mt-1 text-xs text-slate-400">ลบ Widget ออกก่อนเพื่อเพิ่มรายการอื่น</p>
                </div>
              ) : (
                tiers.map(tier => {
                  const tierWidgets = available.filter(e => e.requiredPlan === tier)
                  if (tierWidgets.length === 0) return null
                  return (
                    <div key={tier} className="mb-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TIER_BADGE_CLASS[tier]}`}>
                          {TIER_LABELS[tier]}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {tierWidgets.map(entry => {
                          const accessible = canAccess(entry, plan)
                          return (
                            <button
                              key={entry.id}
                              onClick={() => handleCardClick(entry)}
                              className={`w-full rounded-xl border p-3 text-left transition-all ${
                                accessible
                                  ? 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                                  : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-700">{entry.titleTh}</p>
                                  <p className="mt-0.5 text-xs text-slate-400">{entry.descriptionTh}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5">
                                  {entry.colSpan === 2 && (
                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                      wide
                                    </span>
                                  )}
                                  {!accessible && (
                                    <Lock size={14} className="text-slate-400" />
                                  )}
                                  {accessible && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                                      <Plus size={12} className="text-blue-500" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
