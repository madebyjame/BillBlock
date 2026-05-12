import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, X, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string
  label: string
  desc: string
  done: boolean
  path: string
  cta: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingChecklist() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const storageKey = `bb_onboarding_done_${user?.id ?? ''}`
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === '1')
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    if (dismissed || !user) return
    void load()
  }, [user, dismissed]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const uid = user!.id

      const [profileRes, docRes, custRes, prodRes] = await Promise.all([
        supabase.from('profiles').select('company_name').eq('id', uid).maybeSingle(),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('products').select('id',  { count: 'exact', head: true }).eq('user_id', uid),
      ])

      const hasCompany  = !!profileRes.data?.company_name
      const hasDoc      = (docRes.count  ?? 0) > 0
      const hasCust     = (custRes.count ?? 0) > 0
      const hasProd     = (prodRes.count ?? 0) > 0

      const next: Step[] = [
        {
          id:    'company',
          label: 'ตั้งค่าชื่อบริษัท',
          desc:  'ชื่อบริษัทและโลโก้จะปรากฏบนเอกสารทุกฉบับ',
          done:  hasCompany,
          path:  '/settings',
          cta:   'ไปตั้งค่า',
        },
        {
          id:    'customer',
          label: 'เพิ่มลูกค้าคนแรก',
          desc:  'เพิ่มข้อมูลลูกค้าเพื่อออกเอกสารได้รวดเร็วขึ้น',
          done:  hasCust,
          path:  '/customers',
          cta:   'เพิ่มลูกค้า',
        },
        {
          id:    'product',
          label: 'เพิ่มสินค้าหรือบริการ',
          desc:  'ลิสต์สินค้าช่วยออกเอกสารได้เร็วโดยไม่ต้องพิมพ์ซ้ำ',
          done:  hasProd,
          path:  '/products',
          cta:   'เพิ่มสินค้า',
        },
        {
          id:    'document',
          label: 'ออกเอกสารฉบับแรก',
          desc:  'ลองสร้างใบเสนอราคาหรือใบแจ้งหนี้ฉบับแรกดูเลย',
          done:  hasDoc,
          path:  '/quotations/new',
          cta:   'สร้างเอกสาร',
        },
      ]

      setSteps(next)
      const done = next.every(s => s.done)
      setAllDone(done)
      // auto-dismiss after 3s if all done
      if (done) setTimeout(() => dismiss(), 3000)
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const doneCount = steps.filter(s => s.done).length
  const pct = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0

  if (loading) {
    return (
      <div className="mb-6 h-32 animate-pulse rounded-2xl bg-slate-100" />
    )
  }

  return (
    <div className={`mb-6 overflow-hidden rounded-2xl border shadow-sm transition-all ${
      allDone
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div className="flex-1">
          {allDone ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <p className="font-bold text-emerald-700">พร้อมใช้งานแล้ว! 🎉</p>
            </div>
          ) : (
            <>
              <p className="font-semibold text-slate-800">เริ่มต้นใช้งาน BillBlock</p>
              <p className="mt-0.5 text-xs text-slate-500">ทำ {steps.length - doneCount} ขั้นตอนที่เหลือเพื่อเริ่มออกเอกสาร</p>
            </>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{doneCount}/{steps.length} เสร็จแล้ว</p>
        </div>

        <button
          onClick={dismiss}
          className="ml-4 mt-0.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          title="ปิด"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps */}
      {!allDone && (
        <div className="border-t border-blue-100 divide-y divide-blue-50">
          {steps.map(step => (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                step.done ? 'opacity-50' : 'hover:bg-white/60'
              }`}
            >
              {step.done
                ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                : <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-xs text-slate-400">{step.desc}</p>
                )}
              </div>
              {!step.done && (
                <button
                  onClick={() => navigate(step.path)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {step.cta}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Plan limits notice */}
      {!allDone && (
        <div className="border-t border-blue-100 bg-blue-50/60 px-6 py-3">
          <p className="text-[11px] text-slate-400">
            🔒 <span className="font-medium text-slate-500">แผนฟรี:</span> เอกสาร 5 ฉบับ/เดือน · ลูกค้า 5 ราย · สินค้า 5 รายการ ·{' '}
            <button onClick={() => navigate('/settings?tab=billing')} className="text-blue-600 hover:underline">
              อัพเกรด →
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
