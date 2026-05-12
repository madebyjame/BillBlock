import { useEffect, useState } from 'react'
import { getDocumentEvents, type DocumentEvent } from '../lib/documentEventsApi'

interface Props {
  documentId: string
  createdAt?: string
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: (e: DocumentEvent) => string }> = {
  status_changed: {
    icon: '🔄',
    color: 'bg-blue-100 text-blue-700',
    label: (e) => `เปลี่ยนสถานะ: ${STATUS_LABEL[e.old_value ?? ''] ?? e.old_value} → ${STATUS_LABEL[e.new_value ?? ''] ?? e.new_value}`,
  },
  exported_pdf: {
    icon: '📄',
    color: 'bg-green-100 text-green-700',
    label: () => 'Export PDF',
  },
  saved: {
    icon: '💾',
    color: 'bg-slate-100 text-slate-600',
    label: () => 'บันทึกเอกสาร',
  },
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DocumentTimeline({ documentId, createdAt, onClose }: Props) {
  const [events, setEvents] = useState<DocumentEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void getDocumentEvents(documentId).then(data => {
      setEvents(data)
      setLoading(false)
    })
  }, [documentId])

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">ประวัติเอกสาร</h2>
          <p className="text-xs text-slate-400">Timeline</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <ol className="relative border-l-2 border-slate-100 pl-5 space-y-5">
            {events.length === 0 && !createdAt ? (
              <li className="text-sm text-slate-400">ยังไม่มีประวัติกิจกรรม</li>
            ) : null}

            {events.map(event => {
              const cfg = EVENT_CONFIG[event.event_type]
              return (
                <li key={event.id} className="relative">
                  <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-sm">
                    {cfg?.icon ?? '📝'}
                  </span>
                  <div className={`rounded-xl px-3 py-2.5 text-xs ${cfg?.color ?? 'bg-slate-100 text-slate-600'}`}>
                    <p className="font-semibold">{cfg?.label(event) ?? event.event_type}</p>
                    <p className="mt-0.5 opacity-70">{fmtDateTime(event.created_at)}</p>
                  </div>
                </li>
              )
            })}

            {/* สร้างเอกสาร (จาก created_at ของ documents table) */}
            {createdAt && (
              <li className="relative">
                <span className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-sm">
                  ✨
                </span>
                <div className="rounded-xl bg-violet-50 px-3 py-2.5 text-xs text-violet-700">
                  <p className="font-semibold">สร้างเอกสาร</p>
                  <p className="mt-0.5 opacity-70">{fmtDateTime(createdAt)}</p>
                </div>
              </li>
            )}
          </ol>
        )}
      </div>
    </div>
  )
}
