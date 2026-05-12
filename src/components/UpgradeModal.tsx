import { useNavigate } from 'react-router-dom'
import { Zap, X, FileText, Users, Package } from 'lucide-react'

type Resource = 'documents' | 'customers' | 'products'

interface Props {
  resource: Resource
  limit: number
  onClose: () => void
}

const RESOURCE_COPY = {
  documents: {
    Icon: FileText,
    title: 'ถึงขีดจำกัดเอกสารแล้ว',
    desc: (limit: number) => `คุณสร้างเอกสารครบ ${limit} ฉบับในเดือนนี้แล้ว อัปเกรดเป็น Pro เพื่อสร้างเอกสารไม่จำกัด`,
  },
  customers: {
    Icon: Users,
    title: 'ถึงขีดจำกัดลูกค้าแล้ว',
    desc: (limit: number) => `คุณมีลูกค้าครบ ${limit} รายแล้ว อัปเกรดเป็น Pro เพื่อเพิ่มลูกค้าไม่จำกัด`,
  },
  products: {
    Icon: Package,
    title: 'ถึงขีดจำกัดสินค้าแล้ว',
    desc: (limit: number) => `คุณมีสินค้าครบ ${limit} รายการแล้ว อัปเกรดเป็น Pro เพื่อเพิ่มสินค้าไม่จำกัด`,
  },
} as const

export default function UpgradeModal({ resource, limit, onClose }: Props) {
  const navigate = useNavigate()
  const { Icon, title, desc } = RESOURCE_COPY[resource]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Icon className="h-5 w-5 text-amber-500" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 flex-1 overflow-y-auto">
          <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
          <p className="mb-5 text-sm leading-relaxed text-slate-500">{desc(limit)}</p>

          {/* Plan comparison */}
          <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Free</span>
              <span className="font-semibold text-blue-600">Pro — ฿149/เดือน</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              {[
                ['เอกสาร', '20 ฉบับ/เดือน', 'ไม่จำกัด'],
                ['ลูกค้า', '50 ราย', 'ไม่จำกัด'],
                ['สินค้า', '50 รายการ', 'ไม่จำกัด'],
              ].map(([label, free, pro]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex gap-6">
                    <span className="w-24 text-right text-slate-400 line-through">{free}</span>
                    <span className="w-16 text-right font-semibold text-blue-600">{pro}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => { navigate('/settings?tab=billing'); onClose() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            อัปเกรดเป็น Pro
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-xl py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ไม่ใช่ตอนนี้
          </button>
        </div>
      </div>
    </div>
  )
}
