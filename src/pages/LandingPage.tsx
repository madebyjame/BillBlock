import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, BarChart3, Users, Package, Download, Palette,
  CheckCircle2, Star, Zap, Shield, Globe, ArrowRight,
  Receipt, ClipboardList, Building2, Mail, TrendingUp,
  Lock, FileSpreadsheet, X, Layers,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: FileText,
    title: 'เอกสารครบ 6 ประเภท',
    desc: 'ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ใบวางบิล ใบกำกับภาษี ใบลดหนี้ — พร้อม PDF คุณภาพสูง',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & รายงาน',
    desc: 'รายรับ-รายจ่าย, P&L, VAT, WHT, AR Aging, ยอดขายต่อสินค้า — ครบสำหรับยื่นภาษี',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Users,
    title: 'CRM ลูกค้า',
    desc: 'ประวัติการซื้อ ยอดค้างรับ เกรดลูกค้า A–F และ portal ให้ลูกค้าดูเอกสารเอง',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Package,
    title: 'คลังสินค้า',
    desc: 'บริหาร stock ปรับยอด ติดตาม movement และคำนวณ COGS อัตโนมัติ',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Mail,
    title: 'ส่งอีเมลอัตโนมัติ',
    desc: 'ส่งเอกสารให้ลูกค้าพร้อม portal link โดยตรง — ไม่ต้องเปิด Gmail เอง',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: TrendingUp,
    title: 'รับชำระ PromptPay',
    desc: 'สร้าง QR Code PromptPay ในเอกสาร ลูกค้าสแกนชำระ สถานะอัพเดทอัตโนมัติ',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Globe,
    title: 'หลายสกุลเงิน',
    desc: 'รองรับ THB, USD, EUR, JPY, SGD, MYR, GBP, CNY ครอบคลุมการค้าระหว่างประเทศ',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Shield,
    title: 'ปลอดภัยระดับองค์กร',
    desc: 'Row Level Security บน Supabase — ข้อมูลของคุณมองเห็นได้เฉพาะคุณเท่านั้น',
    color: 'bg-slate-50 text-slate-600',
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
  annual: number
  highlight: boolean
  badge: string | null
  color: string
  btnClass: string
  features: { text: string; included: boolean }[]
  cta: string
}

const PLANS: PlanDef[] = [
  {
    name: 'Free',
    nameEn: 'free',
    monthly: 0,
    annual: 0,
    highlight: false,
    badge: null,
    color: 'text-slate-600',
    btnClass: 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
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
    annual: 127,
    highlight: true,
    badge: 'แนะนำ',
    color: 'text-blue-600',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
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
    annual: 360,
    highlight: false,
    badge: null,
    color: 'text-violet-600',
    btnClass: 'border border-violet-200 text-violet-700 hover:bg-violet-50',
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
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BillBlock</span>
          </div>
          <nav className="hidden gap-8 text-sm text-slate-500 md:flex">
            <a href="#features"     className="hover:text-blue-600 transition-colors">ฟีเจอร์</a>
            <a href="#pricing"      className="hover:text-blue-600 transition-colors">ราคา</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">รีวิว</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              เริ่มใช้งาน →
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-50 to-transparent opacity-60 blur-3xl" />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700"
          >
            <Zap className="h-3.5 w-3.5" />
            สำหรับฟรีแลนซ์ และ SME ไทย · ใช้ฟรีได้เลย
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="mb-5 text-5xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-6xl"
          >
            ออกบิลมืออาชีพ<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              ในไม่กี่วินาที
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mb-8 text-lg leading-relaxed text-slate-500">
            ครบทั้งใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ รายงาน VAT/WHT/P&L<br className="hidden sm:block" />
            ส่ง PDF ทางอีเมล รับชำระ PromptPay — จบในที่เดียว
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              เริ่มใช้งานฟรี
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#pricing"
              className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
            >
              ดูราคา
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-xs text-slate-400">
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
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
            >
              <Icon className="h-3.5 w-3.5 text-blue-500" />
              {label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: '6',    label: 'ประเภทเอกสาร' },
            { value: '8+',   label: 'สกุลเงิน' },
            { value: '5',    label: 'รายงานบัญชี' },
            { value: '฿0',   label: 'เริ่มต้นใช้งาน' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-blue-600">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">ฟีเจอร์ครบ จบในที่เดียว</h2>
            <p className="mt-3 text-slate-500">ทุกสิ่งที่ธุรกิจไทยต้องการ ไม่ต้องใช้หลายแอป</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-800">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">ราคาตรงไปตรงมา</h2>
            <p className="mt-3 text-slate-500">ไม่มีค่าธรรมเนียมซ่อน · ยกเลิกได้ทุกเมื่อ</p>
          </div>

          {/* Billing toggle */}
          <div className="mb-12 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? 'text-slate-800' : 'text-slate-400'}`}>รายเดือน</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative h-6 w-11 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-slate-800' : 'text-slate-400'}`}>
              รายปี
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                ประหยัด 15–20%
              </span>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan, i) => {
              const price = annual ? plan.annual : plan.monthly
              const isFree = plan.nameEn === 'free'
              return (
                <motion.div
                  key={plan.nameEn}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex flex-col rounded-2xl bg-white p-8 ${
                    plan.highlight
                      ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-100'
                      : 'border border-slate-200 shadow-sm'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white shadow">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className={`mb-1 text-sm font-bold uppercase tracking-wider ${plan.color}`}>{plan.name}</p>
                    <div className="flex items-end gap-1">
                      {isFree ? (
                        <span className="text-4xl font-extrabold text-slate-900">ฟรี</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold text-slate-900">฿{price}</span>
                          <span className="mb-1 text-sm text-slate-400">/เดือน</span>
                        </>
                      )}
                    </div>
                    {!isFree && annual && (
                      <p className="mt-1 text-xs text-slate-400">
                        เรียกเก็บ ฿{price * 12} ต่อปี · ประหยัด ฿{(plan.monthly - plan.annual) * 12}/ปี
                      </p>
                    )}
                    {!isFree && !annual && (
                      <p className="mt-1 text-xs text-slate-400">
                        หรือ ฿{plan.annual}/เดือน เมื่อชำระรายปี
                      </p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map(({ text, included }) => (
                      <li key={text} className="flex items-start gap-2.5 text-sm">
                        {included
                          ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          : <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        }
                        <span className={included ? 'text-slate-700' : 'text-slate-400'}>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${plan.btnClass}`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            ราคาทั้งหมดเป็นสกุลเงินบาท (THB) · ชำระผ่านบัตรเครดิตหรือโอนเงิน
          </p>
        </div>
      </section>

      {/* ── Compare table (compact) ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">เปรียบเทียบแผน</h2>
          <div className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">ฟีเจอร์</th>
                  <th className="px-4 py-4 text-center font-semibold text-slate-600">Free</th>
                  <th className="px-4 py-4 text-center font-bold text-blue-600">Pro</th>
                  <th className="px-4 py-4 text-center font-semibold text-violet-600">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                ].map(([feat, free, pro, biz]) => (
                  <tr key={feat} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-medium text-slate-700">{feat}</td>
                    <td className="px-4 py-3.5 text-center text-slate-500">{free}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-blue-600">{pro}</td>
                    <td className="px-4 py-3.5 text-center text-violet-600">{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">เสียงจากผู้ใช้จริง</h2>
            <p className="mt-3 text-slate-500">ฟรีแลนซ์และเจ้าของธุรกิจที่ใช้ BillBlock ทุกวัน</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {name[2]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-16 text-center text-white shadow-2xl shadow-blue-200"
        >
          <h2 className="mb-4 text-4xl font-bold">พร้อมเริ่มแล้วหรือยัง?</h2>
          <p className="mb-8 text-blue-100 leading-relaxed">
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
      <footer className="border-t border-slate-100 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-800">BillBlock</span>
              <span className="text-slate-400 text-sm">ระบบเอกสารธุรกิจสำหรับธุรกิจไทย</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <a href="/terms"   className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้บริการ</a>
              <a href="/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="/refund"  className="hover:text-slate-600 transition-colors">นโยบายการคืนเงิน</a>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            © 2026 BillBlock · Made with ❤️ for Thai businesses
          </div>
        </div>
      </footer>

    </div>
  )
}
