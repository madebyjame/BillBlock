import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials':            'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่',
  'Email not confirmed':                  'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ',
  'User already registered':              'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน',
  'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
}

function toThaiError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return val
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: '' }
  if (pw.length < 6)   return { level: 1, label: 'สั้นเกินไป', color: 'bg-red-400' }
  const hasUpper = /[A-Z]/.test(pw)
  const hasNum   = /[0-9]/.test(pw)
  const hasSpec  = /[^A-Za-z0-9]/.test(pw)
  const score    = (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0)
  if (pw.length >= 12 && score >= 2) return { level: 3, label: 'แข็งแกร่ง', color: 'bg-emerald-500' }
  if (pw.length >= 8  && score >= 1) return { level: 2, label: 'ปานกลาง', color: 'bg-amber-400' }
  return { level: 1, label: 'อ่อน', color: 'bg-red-400' }
}

// ─── EyeToggle ────────────────────────────────────────────────────────────────

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {show ? (
          <motion.span key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <EyeOff className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Eye className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mode, setMode]                         = useState<Mode>('register')
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [showPassword, setShowPassword]         = useState(false)
  const [showConfirm, setShowConfirm]           = useState(false)
  const [loading, setLoading]                   = useState(false)
  const [googleLoading, setGoogleLoading]       = useState(false)
  const [consented, setConsented]               = useState(false)

  const strength = getStrength(password)
  const mismatch = mode === 'register' && confirmPassword.length > 0 && password !== confirmPassword

  function switchMode(next: Mode) {
    if (loading || googleLoading) return
    setMode(next)
    setConsented(false)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (mode === 'register') {
      if (password.length < 6) { toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
      if (password !== confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return }
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('ส่งอีเมลยืนยันแล้ว', {
          description: 'กรุณาตรวจสอบกล่องจดหมายของคุณ',
          duration: 6000,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(toThaiError(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) { toast.error('กรุณากรอกอีเมลก่อน'); return }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว', {
        description: `ตรวจสอบกล่องจดหมาย ${email}`,
        duration: 6000,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(toThaiError(msg))
    }
  }

  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      toast.error(toThaiError(msg))
      setGoogleLoading(false)
    }
  }

  const submitDisabled =
    loading || googleLoading ||
    (mode === 'register' && (!consented || mismatch || password.length < 6))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e3a8a] shadow-lg shadow-blue-900/25 mb-4">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight">BillBlock</h1>
          <p className="text-sm font-medium text-emerald-600 mt-1">ฟรี · ไม่ต้องใช้บัตรเครดิต · ยกเลิกได้ทุกเมื่อ</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">

          {/* Tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden mb-7 text-sm font-semibold p-1 gap-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
                mode === 'login' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              สมัครฟรี ✨
            </button>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mb-5"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : <GoogleIcon />}
            <span>{mode === 'register' ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">หรือใช้อีเมล</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">อีเมล</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:border-[#1e3a8a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all duration-150"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">รหัสผ่าน</label>
                {mode === 'login' && (
                  <button type="button" onClick={handleForgotPassword}
                    className="text-xs text-[#1e3a8a] hover:underline transition-colors">
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm placeholder-slate-400 focus:border-[#1e3a8a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 transition-all duration-150"
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>

              {/* Password strength — register only */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        strength.level >= i ? strength.color : 'bg-slate-100'
                      }`} />
                    ))}
                  </div>
                  <p className={`mt-1 text-[11px] font-medium ${
                    strength.level === 1 ? 'text-red-500' :
                    strength.level === 2 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    {strength.label}
                    {strength.level === 1 && password.length < 6 && ' — ต้องอย่างน้อย 6 ตัวอักษร'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password — register only */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-11 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-3 transition-all duration-150 ${
                      mismatch
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-[#1e3a8a] focus:ring-blue-100'
                    }`}
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                </div>
                {mismatch && (
                  <p className="mt-1 text-[11px] font-medium text-red-500">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>
            )}

            {/* Consent — register only */}
            {mode === 'register' && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={e => setConsented(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#1e3a8a] cursor-pointer"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  ฉันยอมรับ{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-[#1e3a8a] underline underline-offset-2 hover:text-[#1e40af]">
                    เงื่อนไขการใช้บริการ
                  </a>
                  {' '}และ{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-[#1e3a8a] underline underline-offset-2 hover:text-[#1e40af]">
                    นโยบายความเป็นส่วนตัว
                  </a>
                </span>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitDisabled}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-1 ${
                mode === 'register'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-200'
                  : 'bg-[#1e3a8a] hover:bg-[#1e40af] active:bg-[#1e3a8a] shadow-blue-900/20'
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? (mode === 'login' ? 'กำลังเข้าสู่ระบบ...' : 'กำลังสมัคร...')
                : (mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี')}
            </button>

            {/* Switch mode link */}
            <p className="text-center text-xs text-slate-400 pt-1">
              {mode === 'register' ? (
                <>มีบัญชีแล้ว?{' '}
                  <button type="button" onClick={() => switchMode('login')}
                    className="font-semibold text-[#1e3a8a] hover:underline">
                    เข้าสู่ระบบ
                  </button>
                </>
              ) : (
                <>ยังไม่มีบัญชี?{' '}
                  <button type="button" onClick={() => switchMode('register')}
                    className="font-semibold text-emerald-600 hover:underline">
                    สมัครฟรี
                  </button>
                </>
              )}
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
            <span>ข้อมูลของคุณเข้ารหัสและจัดเก็บอย่างปลอดภัย</span>
          </div>
          <a href="/#pricing" className="block text-[11px] text-slate-400 hover:text-blue-600 transition-colors">
            ดูแผนราคาทั้งหมด →
          </a>
        </div>
      </motion.div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
