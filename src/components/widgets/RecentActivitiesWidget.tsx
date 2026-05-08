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

const DEFAULT_STATUS_META: Record<DashboardDoc['status'], { label: string; cls: string; icon: React.ReactNode }> = {
  draft:     { label: 'ร่าง',        cls: 'bg-slate-100 text-slate-500', icon: <Pencil size={9} /> },
  sent:      { label: 'ส่งแล้ว',    cls: 'bg-amber-100 text-amber-600', icon: <Clock size={9} /> },
  paid:      { label: 'ชำระแล้ว',   cls: 'bg-green-100 text-green-600', icon: <CheckCircle2 size={9} /> },
  cancelled: { label: 'ยกเลิก',     cls: 'bg-red-100 text-red-500',     icon: <XCircle size={9} /> },
}

const QUOTATION_STATUS_META: Record<DashboardDoc['status'], { label: string; cls: string; icon: React.ReactNode }> = {
  draft:     { label: 'ร่าง',         cls: 'bg-slate-100 text-slate-500', icon: <Pencil size={9} /> },
  sent:      { label: 'รอตัดสินใจ',  cls: 'bg-amber-100 text-amber-600', icon: <Clock size={9} /> },
  paid:      { label: 'อนุมัติแล้ว', cls: 'bg-green-100 text-green-600', icon: <CheckCircle2 size={9} /> },
  cancelled: { label: 'ปฏิเสธ',      cls: 'bg-red-100 text-red-500',     icon: <XCircle size={9} /> },
}

const PLACEHOLDER_NAMES = new Set(['ชื่อลูกค้า / บริษัท', 'ชื่อลูกค้า', '-', ''])

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3_600_000
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
          className="flex items-center gap-0.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
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
            const statusMeta = doc.doc_type === 'quotation'
              ? QUOTATION_STATUS_META[doc.status]
              : DEFAULT_STATUS_META[doc.status]
            const rawName = doc.customer_name?.trim() ?? ''
            const customerName = PLACEHOLDER_NAMES.has(rawName) ? '' : rawName
            return (
              <button
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="flex items-center gap-3 py-2.5 text-left transition-colors hover:bg-slate-50 first:pt-0"
              >
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.cls}`}>
                  {statusMeta.icon}
                  {statusMeta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {doc.doc_number
                      ? <span className="font-mono text-blue-600">{doc.doc_number}</span>
                      : DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type
                    }
                    {customerName && (
                      <span className="font-normal text-slate-500"> · {customerName}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-700">฿{fmtAmount(doc.total_amount)}</p>
                  <p className="text-[11px] text-slate-400">{fmtDate(doc.created_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
