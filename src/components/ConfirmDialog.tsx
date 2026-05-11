import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmOptions {
  message: string
  title?: string
  confirmLabel?: string
  danger?: boolean
}

interface Props extends ConfirmOptions {
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'ยืนยัน',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onConfirm, onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="mb-3 flex items-center gap-3">
          {danger && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={15} className="text-red-500" />
            </span>
          )}
          <h3 className="text-base font-semibold text-slate-800">
            {title ?? (danger ? 'ยืนยันการลบ' : 'ยืนยัน')}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">{message}</p>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            ยกเลิก
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
