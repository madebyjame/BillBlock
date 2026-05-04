import React from 'react'
import type { BlockType } from '../types/block'

interface BlockOption {
  type: BlockType
  label: string
  description: string
}

const BLOCK_OPTIONS: BlockOption[] = [
  { type: 'header',   label: 'Header',        description: 'โลโก้ + ข้อมูลบริษัท' },
  { type: 'docInfo',  label: 'Document Info', description: 'เลขที่ + วันที่เอกสาร' },
  { type: 'customer', label: 'Customer',      description: 'ข้อมูลลูกค้า' },
  { type: 'table',    label: 'Table',         description: 'รายการสินค้า/บริการ' },
  { type: 'summary',  label: 'Summary',       description: 'สรุปยอด + VAT' },
  { type: 'footer',   label: 'Footer',        description: 'ลายเซ็น + บัญชีธนาคาร' },
]

interface SidebarProps {
  onAddBlock: (type: BlockType) => void
  onExportPdf: () => void
  isExporting: boolean
}

export default function Sidebar({ onAddBlock, onExportPdf, isExporting }: SidebarProps) {
  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-700">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-800">BillBlock</p>
            <p className="text-[10px] text-slate-400">สร้างเอกสารธุรกิจ</p>
          </div>
        </div>
      </div>

      {/* Add Blocks */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">เพิ่ม Block</p>
        <div className="flex flex-col gap-1">
          {BLOCK_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => onAddBlock(opt.type)}
              className="flex items-start gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-blue-100 hover:bg-blue-50"
            >
              <BlockTypeIcon type={opt.type} />
              <div>
                <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                <p className="text-[10px] text-slate-400">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลัง Export...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function BlockTypeIcon({ type }: { type: BlockType }) {
  const cls = 'mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400'
  const icons: Record<BlockType, React.ReactElement> = {
    header: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      </svg>
    ),
    docInfo: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    customer: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    table: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
      </svg>
    ),
    summary: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    footer: (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  }
  return icons[type]
}
