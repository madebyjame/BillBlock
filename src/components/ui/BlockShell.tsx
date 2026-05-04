import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface BlockShellProps {
  id: string
  children: ReactNode
  onRemove: () => void
  label: string
}

export default function BlockShell({ id, children, onRemove, label }: BlockShellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="group relative mb-2 rounded-md border border-slate-200 bg-white shadow-sm"
    >
      {/* Toolbar — แสดงเมื่อ hover */}
      <div className="absolute -top-px left-0 right-0 flex items-center justify-between rounded-t-md border-b border-slate-100 bg-slate-50 px-3 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            title="ลากเพื่อเรียงลำดับ"
          >
            <GripIcon />
          </button>
          <span className="text-xs font-medium tracking-wide text-slate-400">{label}</span>
        </div>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
          title="ลบ Block"
        >
          <TrashIcon />
          ลบ
        </button>
      </div>

      {/* padding-top พิเศษให้ toolbar ไม่บัง content */}
      <div className="pt-1">{children}</div>
    </div>
  )
}

function GripIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
