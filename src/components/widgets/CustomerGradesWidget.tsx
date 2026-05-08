import { ShieldCheck, ShieldAlert } from 'lucide-react'
import type { DashboardData, GradeEntry } from '../../types/dashboard'

interface Props {
  data: Pick<DashboardData, 'customerGrades' | 'loading'>
}

function GradeBadge({ grade }: { grade: string }) {
  const map: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-blue-100 text-blue-600',
    F: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${map[grade] ?? 'bg-slate-100 text-slate-500'}`}>
      {grade}
    </span>
  )
}

function CustomerRow({ entry }: { entry: GradeEntry }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5">
      <GradeBadge grade={entry.grade} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">{entry.customer_name}</p>
        <p className="text-xs text-slate-400">
          ตรงเวลา {entry.on_time_count} · ล่าช้า {entry.late_count}
          {entry.overdue_count > 0 && (
            <span className="ml-1 text-red-500">· ค้างชำระ {entry.overdue_count}</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default function CustomerGradesWidget({ data }: Props) {
  const gradeA = data.customerGrades?.filter(e => e.grade === 'A') ?? []
  const gradeF = data.customerGrades?.filter(e => e.grade === 'F') ?? []

  if (data.loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!data.customerGrades || data.customerGrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldCheck size={28} className="mb-2 text-slate-200" />
        <p className="text-sm text-slate-400">ยังไม่มีข้อมูลพอ</p>
        <p className="mt-0.5 text-xs text-slate-400">ต้องมีเอกสารที่ผูกลูกค้าก่อน</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      {gradeA.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-green-500" />
            <p className="text-xs font-semibold text-green-600">ลูกค้าชั้นดี</p>
          </div>
          <div className="space-y-1.5">
            {gradeA.slice(0, 4).map(e => <CustomerRow key={e.customer_id} entry={e} />)}
          </div>
        </div>
      )}

      {gradeF.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-red-500" />
            <p className="text-xs font-semibold text-red-600">ต้องระวัง</p>
          </div>
          <div className="space-y-1.5">
            {gradeF.slice(0, 4).map(e => <CustomerRow key={e.customer_id} entry={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}
