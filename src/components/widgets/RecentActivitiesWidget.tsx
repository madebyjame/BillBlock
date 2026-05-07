import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Pencil, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import type { DashboardData, DashboardDoc } from '../../types/dashboard'

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation:      'ใบเสนอราคา',
  invoice:        'ใบแจ้งหนี้',
  receipt:        'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice':  'ใบกำกับภาษี',
}

const STATUS_META: Record<DashboardDoc['status'], { label: string; cls: string; icon: React.ReactNode }> = {
  draft:     { label: 'ร่าง',       cls: 'bg-slate-100 text-slate-500', icon: <Pencil size={9} /> },
  sent:      { label: 'ส่งแล้ว',    cls: 'bg-amber-100 text-amber-600', icon: <Clock size={9} /> },
  paid:      { label: 'ชำระแล้ว',  cls: 'bg-green-100 text-green-600', icon: <CheckCircle2 size={9} /> },
  cancelled: { label: 'ยกเลิก',    cls: 'bg-red-100 text-red-500',     icon: <XCircle size={9} /> },
}

function getCustomerName(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'customer' in content) {
    const c = (content as { customer?: { name?: unknown } }).customer
    if (c && typeof c.name === 'string' && c.name.trim()) return c.name
  }
  return 'ไม่ระบุชื่อ'
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = diffMs / 3_600_000
  if (diffH < 1) return `${Math.round(diffH * 60)} นาทีที่แล้ว`
  if (diffH < 24) return `${Math.round(diffH)} ชม.ที่แล้ว`
  if (diffH < 48) return 'เมื่อวาน'
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })
}

interface Props {
  data: Pick<DashboardData, 'recentDocs' | 'loading'>
}

export default function RecentActivitiesWidget({ data }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
            <Activity size={13} className="text-blue-500" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ความเคลื่อนไหวล่าสุด</p>
        </div>
        <button
          onClick={() => navigate('/documents/invoices')}
          className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </button>
      </div>

      {data.loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : data.recentDocs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Activity size={32} className="mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">ยังไม่มีกิจกรรม</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {data.recentDocs.slice(0, 8).map((doc: DashboardDoc) => {
            const meta = STATUS_META[doc.status]
            return (
              <button
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50 first:pt-0"
              >
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>
                  {meta.icon}
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                    {' · '}
                    <span className="font-normal text-slate-500">{getCustomerName(doc.content)}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{fmtDate(doc.created_at)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
