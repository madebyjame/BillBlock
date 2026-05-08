import { useNavigate } from 'react-router-dom'
import { FileText, UserPlus, FilePlus, FileCheck } from 'lucide-react'

const ACTIONS = [
  {
    label: 'สร้างใบแจ้งหนี้',
    icon: FileText,
    path: '/editor/new?type=invoice',
    bg: 'bg-emerald-600 hover:bg-emerald-700',
    primary: true,
  },
  {
    label: 'สร้างใบเสนอราคา',
    icon: FilePlus,
    path: '/editor/new?type=quotation',
    bg: 'bg-slate-800 hover:bg-slate-900',
    primary: false,
  },
  {
    label: 'เพิ่มลูกค้าใหม่',
    icon: UserPlus,
    path: '/customers',
    bg: 'bg-slate-600 hover:bg-slate-700',
    primary: false,
  },
  {
    label: 'ใบเสร็จรับเงิน',
    icon: FileCheck,
    path: '/editor/new?type=receipt',
    bg: 'bg-slate-600 hover:bg-slate-700',
    primary: false,
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white transition-all active:scale-[0.98] shadow-sm ${bg}`}
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
