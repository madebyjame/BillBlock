import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

export function KebabMenu({
  onEdit,
  onDelete,
  deleteLabel = 'ลบ',
}: {
  onEdit: () => void
  onDelete: () => void
  deleteLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function handleOpen(e: MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.right - 160 })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="เมนู"
      >
        <MoreVertical size={15} />
      </button>
      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={13} className="text-slate-400" /> แก้ไข
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} /> {deleteLabel}
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
