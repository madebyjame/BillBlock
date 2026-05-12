import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, BarChart3, Users, Package,
  CheckCircle2, Star, Zap, Shield, Globe, ArrowRight,
  Receipt, ClipboardList, Building2, Mail, TrendingUp,
  X, Layers, Moon, Sun,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FileText,
    title: 'เอกสารครบ 6 ประเภท',
    desc: 'ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ใบวางบิล ใบกำกับภาษี ใบลดหนี้ — พร้อม PDF คุณภาพสูง',
    light: 'bg-blue-50 text-blue-600',
    dark:  'bg-blue-950/60 text-blue-400',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & รายงาน',
    desc: 'รายรับ-รายจ่าย, P&L, VAT, WHT, AR Aging, ยอดขายต่อสินค้า — ครบสำหรับยื่นภาษี',
    light: 'bg-violet-50 text-violet-600',
    dark:  'bg-violet-950/60 text-violet-400',
  },
  {
    icon: Users,
    title: 'CRM ลูกค้า',
    desc: 'ประวัติการซื้อ ยอดค้างรับ เกรดลูกค้า A–F และ portal ให้ลูกค้าดูเอกสารเอง',
    light: 'bg-emerald-50 text-emerald-600',
    dark:  'bg-emerald-950/60 text-emerald-400',
  },
  {
    icon: Package,
    title: 'คลังสินค้า',
    desc: 'บริหาร stock ปรับยอด ติดตาม movement และคำนวณ COGS อัตโนมัติ',
    light: 'bg-orange-50 text-orange-600',
    dark:  'bg-orange-950/60 text-orange-400',
  },
  {
    icon: Mail,
    title: 'ส่งอีเมลอัตโนมัติ',
    desc: 'ส่งเอกสารให้ลูกค้าพร้อม portal link โดยตรง — ไม่ต้องเปิด Gmail เอง',
    light: 'bg-sky-50 text-sky-600',
    dark:  'bg-sky-950/60 text-sky-400',
  },
  {
    icon: TrendingUp,
    title: 'รับชำระ PromptPay',
    desc: 'สร้าง QR Code PromptPay ในเอกสาร ลูกค้าสแกนชำระ สถานะอัพเดทอัตโนมัติ',
    light: 'bg-green-50 text-green-600',
    dark:  'bg-green-950/60 text-green-400',
  },
  {
    icon: Globe,
    title: 'หลายสกุลเงิน',
    desc: 'รองรับ THB, USD, EUR, JPY, SGD, MYR, GBP, CNY ครอบคลุมการค้าระหว่างประเทศ',
    light: 'bg-indigo-50 text-indigo-600',
    dark:  'bg-indigo-950/60 text-indigo-400',
  },
  {
    icon: Shield,
    title: 'ปลอดภัยระดับองค์กร',
    desc: 'Row Level Security บน Supabase — ข้อมูลของคุณมองเห็นได้เฉพาะคุณเท่านั้น',
    light: 'bg-slate-100 text-slate-600',
    dark:  'bg-slate-800 text-slate-400',
  },
]

const DOC_TYPES = [
  { icon: ClipboardList, label: 'ใบเสนอราคา' },
  { icon: FileText,      label: 'ใบแจ้งหนี้' },
  { icon: Receipt,       label: 'ใบเสร็จรับเงิน' },
  { icon: Building2,     label: 'ใบวางบิล' },
  { icon: FileText,      label: 'ใบกำกับภาษี' },
  { icon: Layers,        label: 'ใบลดหนี้' },
]

interface PlanDef {
  name: string
  nameEn: 'free' | 'pro' | 'business'
  monthly: number
  annualTotal: number   // monthly × 10
  highlight: boolean
  badge: string | null
  lightColor: string
  darkColor: string
  lightBtn: string
  darkBtn: string
  features: { text: string; included: boolean }[]
  cta: string
}

const PLANS: PlanDef[] = [
  {
    name: 'Free',
    nameEn: 'free',
    monthly: 0,
    annualTotal: 0,
    highlight: false,
    badge: null,
    lightColor: 'text-slate-600',
    darkColor:  'text-slate-400',
    lightBtn: 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    darkBtn:  'border border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800',
    cta: 'เริ่มใช้ฟรี',
    features: [
      { text: 'เอกสาร 5 ฉบับ/เดือน',       included: true  },
      { text: 'ลูกค้าสูงสุด 5 ราย',          included: true  },
      { text: 'สินค้าสูงสุด 5 รายการ',        included: true  },
      { text: 'ลายเซ็น 1 รายการ',            included: true  },
      { text: 'ส่งออก PDF',                  included: true  },
      { text: 'Dashboard พื้นฐาน',           included: true  },
      { text: 'ส่งอีเมลอัตโนมัติ',            included: false },
      { text: 'รายงาน VAT / WHT / P&L',     included: false },
      { text: 'Export Excel',                included: false },
    ],
  },
  {
    name: 'Pro',
    nameEn: 'pro',
    monthly: 149,
    annualTotal: 1490,   // 149 × 10
    highlight: true,
    badge: 'แนะนำ',
    lightColor: 'text-blue-600',
    darkColor:  'text-blue-400',
    lightBtn: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
    darkBtn:  'bg-blue-500 text-white hover:bg-blue-400 shadow-md shadow-blue-900',
    cta: 'เริ่มใช้ Pro',
    features: [
      { text: 'เอกสาร 100 ฉบับ/เดือน',      included: true  },
      { text: 'ลูกค้าสูงสุด 50 ราย',          included: true  },
      { text: 'สินค้าสูงสุด 50 รายการ',        included: true  },
      { text: 'ลายเซ็น 5 รายการ',            included: true  },
      { text: 'ส่งออก PDF คุณภาพสูง',         included: true  },
      { text: 'Dashboard ขั้นสูง + กราฟ',     included: true  },
      { text: 'ส่งอีเมลอัตโนมัติ',            included: true  },
      { text: 'รายงาน VAT / WHT / P&L',     included: true  },
      { text: 'Export Excel',                included: false },
    ],
  },
  {
    name: 'Business',
    nameEn: 'business',
    monthly: 450,
    annualTotal: 4500,   // 450 × 10
    highlight: false,
    badge: null,
    lightColor: 'text-violet-600',
    darkColor:  'text-violet-400',
    lightBtn: 'border border-violet-200 text-violet-700 hover:bg-violet-50',
    darkBtn:  'border border-violet-700 text-violet-300 hover:bg-violet-950',
    cta: 'เริ่มใช้ Business',
    features: [
      { text: 'เอกสารไม่จำกัด',              included: true  },
      { text: 'ลูกค้าไม่จำกัด',              included: true  },
      { text: 'สินค้าไม่จำกัด',              included: true  },
      { text: 'ลายเซ็นไม่จำกัด',            included: true  },
      { text: 'ส่งออก PDF คุณภาพสูง',         included: true  },
      { text: 'Dashboard ขั้นสูง + กราฟ',     included: true  },
      { text: 'ส่งอีเมลอัตโนมัติ',            included: true  },
      { text: 'รายงาน VAT / WHT / P&L',     included: true  },
      { text: 'Export Excel ทุกหน้า',        included: true  },
    ],
  },
]

const TESTIMONIALS = [
  {
    name: 'คุณสมชาย',
    role: 'เจ้าของร้านค้าออนไลน์',
    text: 'ประหยัดเวลาออกเอกสารไปกว่า 3 ชั่วโมงต่อสัปดาห์ ลูกค้าชื่นชมว่าเอกสารดูมืออาชีพมาก',
    stars: 5,
  },
  {
    name: 'คุณนภา',
    role: 'Graphic Designer อิสระ',
    text: 'ก่อนหน้าต้องทำใบเสนอราคาใน Word ทุกครั้ง ตอนนี้ไม่กี่คลิกก็เสร็จ PDF ส่งลูกค้าได้เลย',
    stars: 5,
  },
  {
    name: 'คุณวิชัย',
    role: 'ผู้จัดการฝ่ายบัญชี SME',
    text: 'รายงาน VAT กับ P&L ช่วยประหยัดเวลาเตรียมข้อมูลภาษีได้มาก ทำเองได้ไม่ต้องพึ่งนักบัญชีตลอดเวลา',
    stars: 5,
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const [annual, setAnnual]   = useState(false)
  const [isDark, setIsDark]   = useState(true)

  // ── Theme helpers ──
  const d = isDark
  const bg        = d ? 'bg-slate-950'                  : 'bg-white'
  const bgSub     = d ? 'bg-slate-900'                  : 'bg-slate-50'
  const navBg     = d ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-100'
  const textPrime = d ? 'text-white'                    : 'text-slate-900'
  const textBody  = d ? 'text-slate-400'                : 'text-slate-500'
  const textMuted = d ? 'text-slate-500'                : 'text-slate-400'
  const navLink   = d ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
  const card      = d ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
  const divider   = d ? 'border-slate-800'              : 'border-slate-100'
  const pill      = d ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
  const tableHead = d ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'
  const tableRow  = d ? 'hover:bg-slate-900 border-slate-800' : 'hover:bg-slate-50 border-slate-100'
  const tableText = d ? 'text-slate-300'                : 'text-slate-700'
  const reviewCard = d ? 'bg-slate-800/60 ring-slate-700' : 'bg-white ring-slate-100'

  return (
    <div className={`min-h-screen ${bg} font-sans antialiased transition-colors duration-300`}>

      {/* ── Nav ── */}
      <header className={`sticky top-0 z-50 border-b ${navBg} backdrop-blur-sm transition-colors duration-300`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className={`text-lg font-bold ${textPrime}`}>BillBlock</span>
          </div>
          <nav className={`hidden gap-8 text-sm md:flex ${navLink}`}>
            <a href="#features"     className="transition-colors">ฟีเจอร์</a>
            <a href="#pricing"      className="transition-colors">ราคา</a>
            <a href="#testimonials" className="transition-colors">รีวิว</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setIsDark(v => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                d ? 'border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
              title={d ? 'เปลี่ยนเป็น Light mode' : 'เปลี่ยนเป็น Dark mode'}
            >
              {d ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`text-sm transition-colors ${navLink}`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/40 hover:bg-blue-500 transition-colors"
            >
              เริ่มใช้งาน →
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          {d ? (
            <>
              <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
              <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-3xl" />
            </>
          ) : (
            <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-50 to-transparent opacity-60 blur-3xl" />
          )}
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp}
            className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${
              d ? 'border-emerald-800 bg-emerald-950/60 text-emerald-400'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            สำหรับฟรีแลนซ์ และ SME ไทย · ใช้ฟรีได้เลย
          </motion.div>

          <motion.h1 variants={fadeUp}
            className={`mb-5 text-5xl font-bold leading-[1.15] tracking-tight md:text-6xl ${textPrime}`}
          >
            ออกบิลมืออาชีพ<br />
            <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              ในไม่กี่วินาที
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className={`mb-8 text-lg leading-relaxed ${textBody}`}>
            ครบทั้งใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ รายงาน VAT/WHT/P&L<br className="hidden sm:block" />
            ส่ง PDF ทางอีเมล รับชำระ PromptPay — จบในที่เดียว
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all"
            >
              เริ่มใช้งานฟรี
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#pricing"
              className={`rounded-xl border px-8 py-3.5 text-base font-semibold transition-all shadow-sm ${
                d ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              ดูราคา
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className={`mt-4 text-xs ${textMuted}`}>
            ไม่ต้องใช้บัตรเครดิต · ยกเลิกได้ทุกเมื่อ
          </motion.p>
        </motion.div>

        {/* Doc type pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-auto mt-14 flex max-w-2xl flex-wrap justify-center gap-2.5"
        >
          {DOC_TYPES.map(({ icon: Icon, label }) => (
            <div key={label}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${pill}`}
            >
              <Icon className="h-3.5 w-3.5 text-blue-500" />
              {label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section className={`border-y ${divider} ${bgSub} px-6 py-10 transition-colors duration-300`}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: '6',   label: 'ประเภทเอกสาร' },
            { value: '8+',  label: 'สกุลเงิน' },
            { value: '5',   label: 'รายงานบัญชี' },
            { value: '฿0',  label: 'เริ่มต้นใช้งาน' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className={`text-3xl font-extrabold ${d ? 'text-blue-400' : 'text-blue-600'}`}>{value}</p>
              <p className={`mt-1 text-sm ${textBody}`}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={`px-6 py-24 ${bg} transition-colors duration-300`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className={`text-4xl font-bold tracking-tight ${textPrime}`}>ฟีเจอร์ครบ จบในที่เดียว</h2>
            <p className={`mt-3 ${textBody}`}>ทุกสิ่งที่ธุรกิจไทยต้องการ ไม่ต้องใช้หลายแอป</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, light, dark }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`group rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${card}`}
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${d ? dark : light}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className={`mb-2 font-semibold ${d ? 'text-slate-100' : 'text-slate-800'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${textBody}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className={`${bgSub} px-6 py-24 transition-colors duration-300`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <h2 className={`text-4xl font-bold tracking-tight ${textPrime}`}>ราคาตรงไปตรงมา</h2>
            <p className={`mt-3 ${textBody}`}>ไม่มีค่าธรรมเนียมซ่อน · ยกเลิกได้ทุกเมื่อ</p>
          </div>

          {/* Billing toggle */}
          <div className="mb-12 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? textPrime : textMuted}`}>รายเดือน</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative h-6 w-11 rounded-full transition-colors ${annual ? 'bg-blue-600' : d ? 'bg-slate-700' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? textPrime : textMuted}`}>
              รายปี
              <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                d ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}>
                2 เดือนฟรี
              </span>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan, i) => {
              const isFree = plan.nameEn === 'free'
              const annualMonthlyAvg = isFree ? 0 : Math.round(plan.annualTotal / 12)
              return (
                <motion.div
                  key={plan.nameEn}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex flex-col rounded-2xl p-8 transition-colors ${
                    plan.highlight
                      ? `ring-2 ring-blue-500 shadow-xl ${d ? 'bg-slate-900 shadow-blue-900/30' : 'bg-white shadow-blue-100'}`
                      : `border shadow-sm ${d ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white shadow">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className={`mb-2 text-sm font-bold uppercase tracking-wider ${d ? plan.darkColor : plan.lightColor}`}>{plan.name}</p>

                    {isFree ? (
                      <div>
                        <span className={`text-4xl font-extrabold ${textPrime}`}>ฟรี</span>
                        <p className={`mt-1 text-xs ${textMuted}`}>ไม่มีค่าใช้จ่าย ตลอดไป</p>
                      </div>
                    ) : annual ? (
                      /* Annual: แสดงราคารายปีเด่น, เฉลี่ยรายเดือนด้านล่าง */
                      <div>
                        <div className="flex items-end gap-1">
                          <span className={`text-4xl font-extrabold ${textPrime}`}>
                            ฿{plan.annualTotal.toLocaleString()}
                          </span>
                          <span className={`mb-1 text-sm ${textMuted}`}>/ปี</span>
                        </div>
                        <p className={`mt-1 text-xs ${textMuted}`}>
                          เฉลี่ย ฿{annualMonthlyAvg}/เดือน · ประหยัด ฿{plan.monthly * 2} เทียบรายเดือน
                        </p>
                      </div>
                    ) : (
                      /* Monthly */
                      <div>
                        <div className="flex items-end gap-1">
                          <span className={`text-4xl font-extrabold ${textPrime}`}>฿{plan.monthly}</span>
                          <span className={`mb-1 text-sm ${textMuted}`}>/เดือน</span>
                        </div>
                        <p className={`mt-1 text-xs ${textMuted}`}>
                          หรือ ฿{plan.annualTotal.toLocaleString()}/ปี เมื่อชำระรายปี (2 เดือนฟรี)
                        </p>
                      </div>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map(({ text, included }) => (
                      <li key={text} className="flex items-start gap-2.5 text-sm">
                        {included
                          ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          : <X className={`mt-0.5 h-4 w-4 shrink-0 ${d ? 'text-slate-700' : 'text-slate-300'}`} />
                        }
                        <span className={included ? (d ? 'text-slate-200' : 'text-slate-700') : textMuted}>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${d ? plan.darkBtn : plan.lightBtn}`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              )
            })}
          </div>

          <p className={`mt-8 text-center text-xs ${textMuted}`}>
            ราคาทั้งหมดเป็นสกุลเงินบาท (THB) · ชำระผ่านบัตรเครดิตหรือโอนเงิน
          </p>
        </div>
      </section>

      {/* ── Compare table ── */}
      <section className={`px-6 py-16 ${bg} transition-colors duration-300`}>
        <div className="mx-auto max-w-4xl">
          <h2 className={`mb-8 text-center text-2xl font-bold ${textPrime}`}>เปรียบเทียบแผน</h2>
          <div className={`overflow-x-auto overflow-hidden rounded-2xl border shadow-sm ${d ? 'border-slate-800' : 'border-slate-200'}`}>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className={`border-b ${tableHead}`}>
                  <th className={`px-6 py-4 text-left font-semibold ${textBody}`}>ฟีเจอร์</th>
                  <th className={`px-4 py-4 text-center font-semibold ${textBody}`}>Free</th>
                  <th className="px-4 py-4 text-center font-bold text-blue-500">Pro</th>
                  <th className={`px-4 py-4 text-center font-semibold ${d ? 'text-violet-400' : 'text-violet-600'}`}>Business</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${d ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {[
                  ['เอกสาร/เดือน',    '5 ฉบับ',      '100 ฉบับ',   'ไม่จำกัด'],
                  ['ลูกค้า',          '5 ราย',        '50 ราย',     'ไม่จำกัด'],
                  ['สินค้า/บริการ',   '5 รายการ',     '50 รายการ',  'ไม่จำกัด'],
                  ['ลายเซ็น',         '1',             '5',          'ไม่จำกัด'],
                  ['ส่งอีเมลอัตโนมัติ','—',           '✓',          '✓'],
                  ['รายงาน VAT/WHT',  '—',            '✓',          '✓'],
                  ['P&L / AR Aging',  '—',            '✓',          '✓'],
                  ['Export Excel',    '—',             '—',          '✓'],
                  ['รับ PromptPay',   '✓',            '✓',          '✓'],
                  ['ราคา/เดือน',      'ฟรี',          '฿149',       '฿450'],
                  ['ราคา/ปี',         'ฟรี',          '฿1,490',     '฿4,500'],
                ].map(([feat, free, pro, biz]) => (
                  <tr key={feat} className={`transition-colors ${tableRow}`}>
                    <td className={`px-6 py-3.5 font-medium ${tableText}`}>{feat}</td>
                    <td className={`px-4 py-3.5 text-center ${textMuted}`}>{free}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-blue-500">{pro}</td>
                    <td className={`px-4 py-3.5 text-center ${d ? 'text-violet-400' : 'text-violet-600'}`}>{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className={`${bgSub} px-6 py-24 transition-colors duration-300`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className={`text-4xl font-bold tracking-tight ${textPrime}`}>เสียงจากผู้ใช้จริง</h2>
            <p className={`mt-3 ${textBody}`}>ฟรีแลนซ์และเจ้าของธุรกิจที่ใช้ BillBlock ทุกวัน</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 shadow-sm ring-1 ${reviewCard}`}
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-5 text-sm leading-relaxed ${d ? 'text-slate-300' : 'text-slate-600'}`}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    d ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {name[2]}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${d ? 'text-slate-100' : 'text-slate-800'}`}>{name}</p>
                    <p className={`text-xs ${textMuted}`}>{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`px-6 py-24 ${bg} transition-colors duration-300`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-16 text-center text-white shadow-2xl ${
            d ? 'shadow-blue-900/40' : 'shadow-blue-200'
          }`}
        >
          <h2 className="mb-4 text-4xl font-bold">พร้อมเริ่มแล้วหรือยัง?</h2>
          <p className="mb-8 leading-relaxed text-blue-100">
            ลงทะเบียนฟรีวันนี้ · ไม่ต้องใช้บัตรเครดิต<br />
            เริ่มออกเอกสารมืออาชีพได้ทันที
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors"
          >
            เริ่มใช้งานฟรี
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t ${divider} px-6 py-10 ${bg} transition-colors duration-300`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
              <span className={`font-bold ${textPrime}`}>BillBlock</span>
              <span className={`text-sm ${textMuted}`}>ระบบเอกสารธุรกิจสำหรับธุรกิจไทย</span>
            </div>
            <div className={`flex items-center gap-6 text-xs ${textMuted}`}>
              <a href="/terms"   className="hover:text-blue-500 transition-colors">เงื่อนไขการใช้บริการ</a>
              <a href="/privacy" className="hover:text-blue-500 transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="/refund"  className="hover:text-blue-500 transition-colors">นโยบายการคืนเงิน</a>
            </div>
          </div>
          <div className={`border-t ${divider} pt-6 text-center text-xs ${textMuted}`}>
            © 2026 BillBlock · Made with ❤️ for Thai businesses
          </div>
        </div>
      </footer>

    </div>
  )
}
