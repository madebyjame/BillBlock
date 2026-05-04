import type { BlockType } from '../types/block'

interface BlockOption {
  type: BlockType
  label: string
  description: string
  icon: string
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    type: 'header',
    label: 'Header',
    description: 'โลโก้ + ชื่อบริษัท',
    icon: '🏢',
  },
  {
    type: 'info',
    label: 'Info',
    description: 'เลขที่เอกสาร + ลูกค้า',
    icon: '📋',
  },
  {
    type: 'table',
    label: 'Table',
    description: 'ตารางรายการสินค้า',
    icon: '📊',
  },
  {
    type: 'text',
    label: 'Text',
    description: 'หมายเหตุ / ข้อความ',
    icon: '📝',
  },
  {
    type: 'footer',
    label: 'Footer',
    description: 'บัญชี + ลายเซ็น',
    icon: '✍️',
  },
]

interface SidebarProps {
  onAddBlock: (type: BlockType) => void
  onExportPdf: () => void
  isExporting: boolean
}

export default function Sidebar({ onAddBlock, onExportPdf, isExporting }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-800">
          <span className="text-blue-600">Bill</span> Block
        </h1>
        <p className="text-xs text-gray-400">สร้างเอกสารธุรกิจ</p>
      </div>

      {/* เพิ่ม Block */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          เพิ่ม Block
        </p>
        <div className="flex flex-col gap-1.5">
          {BLOCK_OPTIONS.map(option => (
            <button
              key={option.type}
              onClick={() => onAddBlock(option.type)}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="text-lg leading-none">{option.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-700">{option.label}</p>
                <p className="text-xs text-gray-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export PDF */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลัง Export...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
