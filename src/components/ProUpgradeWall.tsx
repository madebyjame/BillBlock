import { useNavigate } from 'react-router-dom'
import { Lock, Zap, BarChart3, Mail } from 'lucide-react'

interface Props {
  feature: 'reports' | 'email'
}

const COPY = {
  reports: {
    Icon: BarChart3,
    title: 'รายงานสำหรับแผน Pro ขึ้นไป',
    desc: 'อัปเกรดเพื่อดูรายงาน VAT / WHT / P&L / AR Aging / ยอดขายต่อสินค้า',
    items: [
      'รายงาน VAT (ภ.พ.30)',
      'รายงาน WHT (ภ.ง.ด.3/53)',
      'กำไร & ขาดทุน รายเดือน',
      'AR Aging — ติดตามหนี้',
      'ยอดขายต่อสินค้า',
    ],
  },
  email: {
    Icon: Mail,
    title: 'ส่งอีเมลอัตโนมัติสำหรับแผน Pro ขึ้นไป',
    desc: 'อัปเกรดเพื่อส่งเอกสารทางอีเมลพร้อม portal link ให้ลูกค้าโดยตรง',
    items: [
      'ส่งอีเมลพร้อมเอกสาร PDF',
      'ลูกค้าดูเอกสารผ่าน portal link',
      'ติดตามสถานะการเปิดดู',
    ],
  },
} as const

export default function ProUpgradeWall({ feature }: Props) {
  const navigate = useNavigate()
  const { Icon, title, desc, items } = COPY[feature]

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Icon size={26} className="text-blue-500" />
        </div>

        {/* Lock badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
          <Lock size={11} />
          Pro feature
        </div>

        <h2 className="mb-2 text-lg font-bold text-slate-900">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">{desc}</p>

        {/* Feature list */}
        <ul className="mb-6 space-y-2 text-left">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>

        {/* Pricing hint */}
        <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
          Pro เริ่มต้น <span className="font-semibold text-slate-700">฿149/เดือน</span>
          {' '}หรือ <span className="font-semibold text-blue-600">฿1,490/ปี</span> (2 เดือนฟรี)
        </div>

        <button
          onClick={() => navigate('/settings?tab=billing')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Zap size={15} />
          อัปเกรดเป็น Pro
        </button>
      </div>
    </div>
  )
}
