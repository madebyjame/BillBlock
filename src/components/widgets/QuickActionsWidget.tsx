import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, UserPlus, FilePlus, FileCheck } from 'lucide-react'

const ACTIONS = [
  {
    label: 'สร้างใบแจ้งหนี้',
    icon: FileText,
    path: '/documents/invoices',
    bg: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    label: 'เพิ่มลูกค้าใหม่',
    icon: UserPlus,
    path: '/customers',
    bg: 'bg-emerald-500 hover:bg-emerald-600',
  },
  {
    label: 'สร้างใบเสนอราคา',
    icon: FilePlus,
    path: '/documents/quotations',
    bg: 'bg-violet-500 hover:bg-violet-600',
  },
  {
    label: 'ใบเสร็จรับเงิน',
    icon: FileCheck,
    path: '/documents/receipts',
    bg: 'bg-orange-500 hover:bg-orange-600',
  },
]

export default function QuickActionsWidget() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">ทางลัดด่วน</p>
      <div className="flex flex-1 flex-col gap-2">
        {ACTIONS.map(({ label, icon: Icon, path, bg }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition-all hover:shadow-md active:scale-[0.98] ${bg}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Icon size={14} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
