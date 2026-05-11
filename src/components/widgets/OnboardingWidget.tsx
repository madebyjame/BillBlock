import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface CheckItem {
  key: string
  label: string
  hint: string
  route: string
  done: boolean
}

interface Props {
  data: { companyName: string; loading: boolean }
}

export default function OnboardingWidget({ data }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<CheckItem[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || data.loading) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data.loading])

  async function load() {
    setChecking(true)
    try {
      const uid = user!.id
      const [profileRes, docRes, custRes] = await Promise.all([
        supabase.from('profiles').select('company_name, address, logo_url').eq('id', uid).maybeSingle(),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ])
      const profile = profileRes.data
      const hasDocuments = (docRes.count ?? 0) > 0
      const hasCustomers = (custRes.count ?? 0) > 0

      setItems([
        {
          key: 'company',
          label: 'กรอกข้อมูลบริษัท',
          hint: 'ชื่อ ที่อยู่ เลขผู้เสียภาษี',
          route: '/settings',
          done: !!(profile?.company_name && profile.address),
        },
        {
          key: 'logo',
          label: 'อัปโหลดโลโก้',
          hint: 'โลโก้จะแสดงบนเอกสารทุกใบ',
          route: '/settings',
          done: !!profile?.logo_url,
        },
        {
          key: 'customer',
          label: 'เพิ่มลูกค้ารายแรก',
          hint: 'บันทึกข้อมูลลูกค้าเพื่อออกเอกสารเร็วขึ้น',
          route: '/customers',
          done: hasCustomers,
        },
        {
          key: 'document',
          label: 'สร้างเอกสารรายการแรก',
          hint: 'ใบเสนอราคา ใบแจ้งหนี้ หรือใบเสร็จ',
          route: '/documents/quotations',
          done: hasDocuments,
        },
      ])
    } finally {
      setChecking(false)
    }
  }

  const doneCount = items.filter(i => i.done).length
  const total = items.length
  const allDone = doneCount === total
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  if (checking || data.loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
      </div>
    )
  }

  if (allDone) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 size={20} className="text-green-500" />
        </div>
        <p className="text-sm font-medium text-slate-600">ตั้งค่าครบแล้ว!</p>
        <p className="mt-0.5 text-xs text-slate-400">พร้อมใช้งาน BillBlock เต็มรูปแบบ</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">เริ่มต้นใช้งาน</p>
        <span className="text-xs font-semibold text-slate-500">{doneCount}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-1.5">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => navigate(item.route)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              item.done
                ? 'border-green-100 bg-green-50 opacity-60'
                : 'border-slate-100 hover:bg-slate-50'
            }`}
          >
            {item.done
              ? <CheckCircle2 size={16} className="shrink-0 text-green-500" />
              : <Circle size={16} className="shrink-0 text-slate-300" />
            }
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {item.label}
              </p>
              {!item.done && (
                <p className="text-[11px] text-slate-400">{item.hint}</p>
              )}
            </div>
            {!item.done && <ChevronRight size={13} className="shrink-0 text-slate-300" />}
          </button>
        ))}
      </div>
    </div>
  )
}
