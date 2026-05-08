import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, FlaskConical, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register'

const DEMO_EMAIL = 'test@billblock.demo'
const DEMO_PASSWORD = 'Test1234'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
  'Email not confirmed': 'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ',
  'User already registered': 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน',
  'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
}

function toThaiError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return val
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function switchMode(next: Mode) {
    if (loading || googleLoading) return
    setMode(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
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

  function fillDemo() {
    setMode('login')
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">

      {/* Card */}
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
          <p className="text-sm text-slate-500 mt-1">เอกสารธุรกิจออนไลน์ ครบจบในที่เดียว</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">

          {/* Tab toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden mb-7 text-sm font-semibold p-1 gap-1">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mb-5"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            ) : (
              <GoogleIcon />
            )}
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>

          {/* Demo login */}
          <button
            type="button"
            onClick={fillDemo}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            กรอกบัญชีทดสอบให้อัตโนมัติ
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                อีเมล
              </label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                รหัสผ่าน
              </label>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {showPassword ? (
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
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] py-3 text-sm font-bold text-white hover:bg-[#1e40af] active:bg-[#1e3a8a] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-900/20 mt-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? 'กำลังเข้าสู่ระบบ...'
                : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
          <span>ข้อมูลของคุณเข้ารหัสและจัดเก็บอย่างปลอดภัย</span>
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
