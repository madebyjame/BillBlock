import type { LastDocSummary } from '../lib/smartFillApi'
import { docTypeLabel } from '../lib/smartFillApi'

interface Props {
  doc: LastDocSummary
  onUse: () => void
  onDismiss: () => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SmartFillBanner({ doc, onUse, onDismiss }: Props) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm shadow-sm">
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-violet-800">พบเอกสารล่าสุดของลูกค้านี้</p>
        <p className="text-xs text-violet-600 mt-0.5 truncate">
          {docTypeLabel(doc.doc_type)} {doc.docNumber} &nbsp;·&nbsp;
          {fmtDate(doc.created_at)} &nbsp;·&nbsp;
          {doc.items.length} รายการ &nbsp;·&nbsp;
          ฿{fmtAmount(doc.total_amount)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onUse}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          ใช้รายการจากใบนี้
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-xs text-violet-500 hover:bg-violet-100 transition-colors"
        >
          ปิด
        </button>
      </div>
    </div>
  )
}
