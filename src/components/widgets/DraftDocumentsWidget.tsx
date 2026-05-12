import { useNavigate } from 'react-router-dom'
import type { DashboardData, DashboardDoc } from '../../types/dashboard'

interface Props {
  data: DashboardData
}

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation: 'ใบเสนอราคา',
  invoice: 'ใบแจ้งหนี้',
  receipt: 'ใบเสร็จ',
  purchase_order: 'ใบสั่งซื้อ',
  delivery_note: 'ใบส่งของ',
}

export default function DraftDocumentsWidget({ data }: Props) {
  const navigate = useNavigate()
  const drafts = data.recentDocs
    .filter(d => d.status === 'draft')
    .slice(0, 5)

  if (drafts.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เอกสารฉบับร่าง</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ไม่มีเอกสารฉบับร่าง</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เอกสารฉบับร่าง</p>
      <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
        {drafts.map((doc: DashboardDoc) => (
          <button
            key={doc.id}
            onClick={() => navigate(`/editor/${doc.id}`)}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-700">
                {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type} · {doc.doc_number ?? 'ร่าง'}
              </p>
              <p className="truncate text-[10px] text-slate-400">{doc.customer_name ?? '—'}</p>
            </div>
            <span className="ml-2 shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500">
              ร่าง
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
