import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  BarChart3,
  Users,
  Package,
  Download,
  Palette,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Receipt,
  ClipboardList,
  Building2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'เอกสารธุรกิจครบครัน',
    desc: 'สร้างใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ใบวางบิล และใบกำกับภาษีได้ในที่เดียว',
  },
  {
    icon: BarChart3,
    title: 'แดชบอร์ดวิเคราะห์ธุรกิจ',
    desc: 'ติดตามรายรับ ยอดค้างรับ และแนวโน้มรายได้แบบ real-time พร้อมกราฟที่ปรับแต่งได้',
  },
  {
    icon: Users,
    title: 'จัดการลูกค้า',
    desc: 'เก็บข้อมูลลูกค้าครบถ้วน พร้อมค้นหาและเรียกใช้งานได้ทันทีขณะออกเอกสาร',
  },
  {
    icon: Package,
    title: 'คลังสินค้า & บริการ',
    desc: 'บริหารรายการสินค้าและบริการ ตรวจสอบสต๊อก และแจ้งเตือนเมื่อสินค้าใกล้หมด',
  },
  {
    icon: Download,
    title: 'ส่งออก PDF คุณภาพสูง',
    desc: 'พิมพ์หรือส่งออกเอกสารเป็น PDF รูปแบบมืออาชีพ พร้อมโลโก้และลายเซ็นบริษัท',
  },
  {
    icon: Palette,
    title: 'ปรับแต่งแบรนด์',
    desc: 'เลือกธีมสี อัปโหลดโลโก้ และจัดวางบล็อกเนื้อหาได้ตามต้องการ',
  },
  {
    icon: Globe,
    title: 'หลายสกุลเงิน',
    desc: 'รองรับ THB, USD, EUR, JPY, SGD, MYR, GBP, CNY ครอบคลุมการค้าระหว่างประเทศ',
  },
  {
    icon: Shield,
    title: 'ข้อมูลปลอดภัย',
    desc: 'บันทึกข้อมูลบนคลาวด์ พร้อมระบบล็อกอินและ Row Level Security ระดับองค์กร',
  },
]

const DOC_TYPES = [
  { icon: ClipboardList, label: 'ใบเสนอราคา' },
  { icon: FileText, label: 'ใบแจ้งหนี้' },
  { icon: Receipt, label: 'ใบเสร็จรับเงิน' },
  { icon: Building2, label: 'ใบวางบิล' },
  { icon: FileText, label: 'ใบกำกับภาษี' },
]

const PLANS = [
  {
    name: 'เริ่มต้น',
    nameEn: 'Starter',
    price: 'ฟรี',
    priceNote: 'ตลอดไป',
    color: 'from-slate-500 to-slate-700',
    badge: null,
    features: [
      'เอกสารสูงสุด 20 ฉบับ/เดือน',
      'ลูกค้าสูงสุด 10 ราย',
      'สินค้า/บริการสูงสุด 10 รายการ',
      'เอกสาร 5 ประเภท',
      'ส่งออก PDF',
      'แดชบอร์ดพื้นฐาน',
    ],
    cta: 'เริ่มใช้ฟรี',
    highlight: false,
  },
  {
    name: 'มืออาชีพ',
    nameEn: 'Pro',
    price: '฿299',
    priceNote: '/เดือน',
    color: 'from-blue-500 to-blue-700',
    badge: 'แนะนำ',
    features: [
      'เอกสารไม่จำกัด',
      'ลูกค้าไม่จำกัด',
      'สินค้า/บริการไม่จำกัด',
      'เอกสาร 5 ประเภท',
      'ส่งออก PDF คุณภาพสูง',
      'แดชบอร์ดขั้นสูง + Bento Grid',
      'ปรับแต่งธีมและโลโก้',
      'Multi-currency',
      'Email Support',
    ],
    cta: 'ทดลองใช้ 30 วัน',
    highlight: true,
  },
  {
    name: 'องค์กร',
    nameEn: 'Business',
    price: '฿599',
    priceNote: '/เดือน',
    color: 'from-violet-500 to-violet-700',
    badge: null,
    features: [
      'ทุกอย่างใน Pro',
      'ผู้ใช้งานหลายคน (สูงสุด 5 คน)',
      'หลายกิจการในบัญชีเดียว',
      'นำเข้าสินค้าจาก Excel',
      'API Access',
      'Priority Support',
      'SLA 99.9% Uptime',
    ],
    cta: 'ติดต่อฝ่ายขาย',
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'คุณสมชาย พัฒนาธุรกิจ',
    role: 'เจ้าของร้านค้าออนไลน์',
    text: 'ใช้ BillBlock แล้วประหยัดเวลาออกเอกสารไปได้มากกว่า 3 ชั่วโมงต่อสัปดาห์ ลูกค้าก็ชื่นชมว่าเอกสารดูมืออาชีพมาก',
    stars: 5,
  },
  {
    name: 'คุณนภา ฟรีแลนซ์',
    role: 'กราฟิกดีไซเนอร์อิสระ',
    text: 'ก่อนหน้านี้ต้องทำใบเสนอราคาใน Word ทุกครั้ง ตอนนี้ใช้ BillBlock แค่ไม่กี่คลิกก็เสร็จ พร้อม PDF ส่งลูกค้าได้เลย',
    stars: 5,
  },
  {
    name: 'คุณวิชัย บริษัท ABC',
    role: 'ผู้จัดการฝ่ายบัญชี',
    text: 'แดชบอร์ดติดตามรายรับช่วยให้เห็นภาพรวมธุรกิจได้ชัดเจนขึ้นมาก ทีมงานทุกคนใช้งานได้ง่าย',
    stars: 5,
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BillBlock</span>
          </div>
          <nav className="hidden gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-600 transition-colors">ฟีเจอร์</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">ราคา</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">รีวิว</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              เริ่มใช้งาน
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700">
            <Zap className="h-3.5 w-3.5" />
            ระบบเอกสารธุรกิจสำหรับธุรกิจไทย
          </motion.div>
          <motion.h1 variants={fadeUp} className="mb-6 text-5xl font-extrabold leading-tight text-slate-900 md:text-6xl">
            ออกเอกสารธุรกิจ<br />
            <span className="text-blue-600">ง่าย เร็ว มืออาชีพ</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mb-10 text-lg text-slate-500 leading-relaxed">
            BillBlock คือแพลตฟอร์มจัดการเอกสารธุรกิจครบวงจร ออกใบเสนอราคา ใบแจ้งหนี้
            ใบเสร็จ ใบกำกับภาษี และอื่นๆ ได้ในไม่กี่คลิก พร้อมแดชบอร์ดวิเคราะห์ธุรกิจแบบ real-time
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:shadow-blue-300"
            >
              เริ่มใช้งานฟรี
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#pricing"
              className="rounded-xl border border-slate-200 px-8 py-3.5 font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              ดูแพ็กเกจราคา
            </a>
          </motion.div>
        </motion.div>

        {/* Doc type pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mx-auto mt-16 flex max-w-xl flex-wrap justify-center gap-3"
        >
          {DOC_TYPES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <Icon className="h-4 w-4 text-blue-500" />
              {label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { value: '5', label: 'ประเภทเอกสาร' },
            { value: '8+', label: 'สกุลเงินที่รองรับ' },
            { value: '100%', label: 'Cloud-Based' },
            { value: '฿0', label: 'เริ่มต้นใช้งาน' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-blue-600">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900">ฟีเจอร์ที่ครบครัน</h2>
            <p className="mt-4 text-slate-500">ทุกสิ่งที่ธุรกิจไทยต้องการในที่เดียว</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-800">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900">แพ็กเกจราคา</h2>
            <p className="mt-4 text-slate-500">เลือกแผนที่เหมาะกับธุรกิจของคุณ ไม่มีค่าใช้จ่ายซ่อนเร้น</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.nameEn}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl bg-white p-8 shadow-sm ${plan.highlight ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100' : 'border border-slate-200'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </div>
                )}
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${plan.color} px-3 py-1 text-xs font-semibold text-white`}>
                  {plan.nameEn}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="my-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="mb-1 text-sm text-slate-400">{plan.priceNote}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                      : 'border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">
            ราคาทั้งหมดรวมภาษีมูลค่าเพิ่มแล้ว · ยกเลิกได้ทุกเมื่อ · ชำระผ่านบัตรเครดิตหรือโอนเงิน
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900">เสียงจากลูกค้า</h2>
            <p className="mt-4 text-slate-500">ธุรกิจกว่าพันรายใช้ BillBlock จัดการเอกสารทุกวัน</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">"{text}"</p>
                <div>
                  <p className="font-semibold text-slate-800">{name}</p>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="mb-4 text-4xl font-bold">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="mb-8 text-blue-100">
            ลงทะเบียนฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต เริ่มออกเอกสารมืออาชีพได้ทันที
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

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
            <FileText className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-slate-600">BillBlock</span>
        </div>
        <p className="mt-2">© 2026 BillBlock · ระบบเอกสารธุรกิจสำหรับธุรกิจไทย</p>
      </footer>

    </div>
  )
}
