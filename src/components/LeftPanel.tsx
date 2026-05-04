interface Props {
  onExportPdf: () => void
  isExporting: boolean
}

export default function LeftPanel({ onExportPdf, isExporting }: Props) {
  return (
    <aside className="flex h-full w-44 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-700">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-800">BillBlock</p>
            <p className="text-[10px] text-slate-400">เอกสารธุรกิจ</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="flex-1 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">วิธีใช้</p>
        <div className="space-y-2 text-xs text-slate-500">
          <TipItem icon="✏️" text="คลิกที่ข้อความใดก็ได้เพื่อแก้ไข" />
          <TipItem icon="🔘" text="เปิด-ปิด field ได้จากแถบขวา" />
          <TipItem icon="🖼️" text="คลิกที่โลโก้เพื่ออัปโหลดรูป" />
          <TipItem icon="✍️" text="คลิกที่พื้นที่ลายเซ็นเพื่ออัปโหลด" />
          <TipItem icon="➕" text="เพิ่มรายการได้ในตาราง" />
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
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

function TipItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-sm leading-none mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
