import { useNavigate } from 'react-router-dom'
import { FileText, Users, Package, BarChart2, Download } from 'lucide-react'

interface Shortcut {
  icon: React.ReactNode
  label: string
  sub: string
  path: string
  color: string
}

export default function ExportShortcutsWidget() {
  const navigate = useNavigate()

  const shortcuts: Shortcut[] = [
    {
      icon: <FileText size={15} />,
      label: 'เอกสาร',
      sub: 'ใบแจ้งหนี้ / ใบเสนอราคา',
      path: '/documents',
      color: 'text-blue-500 bg-blue-50 hover:bg-blue-100',
    },
    {
      icon: <Users size={15} />,
      label: 'ลูกค้า',
      sub: 'รายชื่อลูกค้าทั้งหมด',
      path: '/customers',
      color: 'text-violet-500 bg-violet-50 hover:bg-violet-100',
    },
    {
      icon: <Package size={15} />,
      label: 'สินค้า',
      sub: 'คลังสินค้า',
      path: '/products',
      color: 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100',
    },
    {
      icon: <BarChart2 size={15} />,
      label: 'รายงาน P&L',
      sub: 'กำไร-ขาดทุน',
      path: '/reports/pl',
      color: 'text-amber-500 bg-amber-50 hover:bg-amber-100',
    },
  ]

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Download size={14} className="text-slate-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ทางลัด</p>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {shortcuts.map(s => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left transition-colors ${s.color}`}
          >
            <span className="opacity-80">{s.icon}</span>
            <span className="text-xs font-semibold text-slate-700 leading-tight">{s.label}</span>
            <span className="text-[10px] text-slate-400 leading-tight">{s.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
