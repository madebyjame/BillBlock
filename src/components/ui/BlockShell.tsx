import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface BlockShellProps {
  id: string
  children: ReactNode
  onRemove: () => void
  label: string        // ชื่อ block เช่น "Header Block"
}

/**
 * กรอบ wrapper ของทุก Block — มี drag handle, ชื่อ Block, และปุ่มลบ
 * ใช้ useSortable จาก dnd-kit เพื่อรองรับ drag & drop
 */
export default function BlockShell({ id, children, onRemove, label }: BlockShellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative mb-3 rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      {/* แถบด้านบน: drag handle + ชื่อ + ปุ่มลบ */}
      <div className="flex items-center gap-2 rounded-t-lg border-b border-gray-100 bg-gray-50 px-3 py-2">
        {/* Drag Handle */}
        <button
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          title="ลากเพื่อเรียงลำดับ"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </button>

        <span className="flex-1 text-xs font-medium text-gray-500">{label}</span>

        {/* ปุ่มลบ Block */}
        <button
          onClick={onRemove}
          className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="ลบ Block นี้"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* เนื้อหา Block */}
      <div className="p-4">{children}</div>
    </div>
  )
}
