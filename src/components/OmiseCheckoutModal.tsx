/**
 * OmiseCheckoutModal
 *
 * Opens when user clicks "อัปเกรด" in BillingTab.
 * Loads Omise.js, collects card token, calls omise-checkout Edge Function.
 *
 * Required env var (add to .env.local):
 *   VITE_OMISE_PUBLIC_KEY=pkey_test_...
 */
import { useEffect, useRef, useState } from 'react'
import { X, CreditCard, Loader2, CheckCircle2, AlertCircle, Key } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OmiseCard: any
  }
}

type Plan  = 'pro' | 'business'
type Cycle = 'monthly' | 'annual'

const PLAN_LABELS: Record<Plan, string>  = { pro: 'Pro', business: 'Business' }
const PLAN_PRICES: Record<Plan, Record<Cycle, number>> = {
  pro:      { monthly: 390, annual: 312 },
  business: { monthly: 790, annual: 632 },
}

interface Props {
  plan:    Plan
  cycle:   Cycle
  onClose: () => void
  onSuccess: () => void
}

type Step = 'idle' | 'loading' | 'success' | 'error'

export default function OmiseCheckoutModal({ plan, cycle, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('idle')
  const [errMsg, setErrMsg] = useState('')
  const omiseReady = useRef(false)

  const price      = PLAN_PRICES[plan][cycle]
  const totalSatang = cycle === 'annual' ? price * 12 * 100 : price * 100
  const publicKey  = import.meta.env.VITE_OMISE_PUBLIC_KEY as string | undefined
  const hasKey     = !!publicKey

  // Load Omise.js
  useEffect(() => {
    if (!hasKey || omiseReady.current) return
    const script = document.createElement('script')
    script.src = 'https://cdn.omise.co/omise.js'
    script.async = true
    script.onload = () => { omiseReady.current = true }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [hasKey])

  function openOmiseForm() {
    if (!hasKey || !window.OmiseCard) {
      toast.error('Omise ยังไม่พร้อม — กรุณารอสักครู่')
      return
    }
    window.OmiseCard.configure({
      publicKey,
      currency: 'THB',
      amount: totalSatang,
      frameLabel: 'BillBlock',
      submitLabel: `ชำระเงิน ฿${(totalSatang / 100).toLocaleString('th-TH')}`,
      buttonLabel: 'ชำระด้วยบัตร',
    })
    window.OmiseCard.open({
      amount: totalSatang,
      onCreateTokenSuccess: (token: string) => void handleToken(token),
      onFormClosed: () => { /* user closed form */ },
    })
  }

  async function handleToken(token: string) {
    if (!user) return
    setStep('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('omise-checkout', {
        body: { token, plan, cycle, user_id: user.id },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })
      if (res.error) throw new Error(res.error.message)
      const result = res.data as { success?: boolean; error?: string; message?: string }
      if (!result.success) throw new Error(result.message ?? result.error ?? 'ชำระเงินไม่สำเร็จ')
      setStep('success')
      toast.success(`อัปเกรดเป็น ${PLAN_LABELS[plan]} สำเร็จ! 🎉`)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800">
              อัปเกรดเป็น {PLAN_LABELS[plan]}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Plan summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">BillBlock {PLAN_LABELS[plan]}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cycle === 'annual' ? 'ชำระรายปี (ประหยัด 20%)' : 'ชำระรายเดือน'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-slate-900">
                  ฿{cycle === 'annual' ? (price * 12).toLocaleString('th-TH') : price.toLocaleString('th-TH')}
                </p>
                <p className="text-[10px] text-slate-400">
                  {cycle === 'annual' ? '/ปี' : '/เดือน'}
                </p>
              </div>
            </div>
          </div>

          {/* State: no API key */}
          {!hasKey && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <Key size={28} className="text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-800">รอ API Key</p>
                <p className="mt-1 text-xs text-amber-600">
                  ระบบชำระเงินพร้อมแล้ว รอเพิ่ม{' '}
                  <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">VITE_OMISE_PUBLIC_KEY</code>
                  {' '}ใน <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px]">.env.local</code>
                </p>
                <p className="mt-2 text-[11px] text-amber-500">
                  ติดต่อทีมงานเพื่อรับ API key ได้เลย
                </p>
              </div>
            </div>
          )}

          {/* State: loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-slate-600">กำลังดำเนินการชำระเงิน...</p>
            </div>
          )}

          {/* State: success */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <p className="text-sm font-semibold text-slate-800">ชำระเงินสำเร็จ!</p>
              <p className="text-xs text-slate-500">แผน {PLAN_LABELS[plan]} ของคุณพร้อมใช้งานแล้ว</p>
            </div>
          )}

          {/* State: error */}
          {step === 'error' && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <div>
                <p className="text-xs font-semibold text-rose-700">ชำระเงินไม่สำเร็จ</p>
                <p className="text-xs text-rose-600 mt-0.5">{errMsg}</p>
                <button
                  type="button"
                  onClick={() => { setStep('idle'); setErrMsg('') }}
                  className="mt-2 text-[11px] underline text-rose-600 hover:text-rose-700"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* CTA: pay with card */}
          {hasKey && step === 'idle' && (
            <button
              type="button"
              onClick={openOmiseForm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <CreditCard size={15} />
              ชำระด้วยบัตรเครดิต
            </button>
          )}

          {/* Terms */}
          <p className="text-center text-[10px] text-slate-400">
            ชำระเงินผ่าน Omise · ปลอดภัยด้วย SSL · สามารถยกเลิกได้ทุกเวลา
          </p>
        </div>
      </div>
    </div>
  )
}
