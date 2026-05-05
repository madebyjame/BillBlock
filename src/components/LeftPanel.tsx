interface Props {
  onExportPdf: () => void
  isExporting: boolean
  onPreview: () => void
  isPreview: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved'
  themeColor: string
  onSignOut: () => Promise<void>
  onBack?: () => void
  // Explicit save (cloud docs only)
  isDirty?: boolean
  isSaving?: boolean
  onSaveDraft?: () => void
  onSaveAndIssue?: () => void
}

export default function LeftPanel({
  onExportPdf, isExporting, onPreview, isPreview, saveStatus, themeColor,
  onSignOut, onBack, isDirty, isSaving, onSaveDraft, onSaveAndIssue,
}: Props) {
  return (
    <aside className="flex h-full w-44 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand / Back */}
      <div className="border-b border-slate-100 px-4 py-4">
        {onBack ? (
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-2 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            เอกสารทั้งหมด
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: themeColor }}>
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

      {/* Auto-save status */}
      <div className="border-b border-slate-100 px-4 py-2">
        <SaveIndicator status={saveStatus} isDirty={isDirty} />
      </div>

      {/* Tips */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">วิธีใช้</p>
        <div className="space-y-2 text-xs text-slate-500">
          <TipRow icon="✏️" text="คลิกที่ข้อความเพื่อแก้ไข" />
          <TipRow icon="⠿" text="ลากไอคอน drag เพื่อเรียงแถว" />
          <TipRow icon="🗑️" text="Hover แถว → คลิกถังขยะลบ" />
          <TipRow icon="💡" text="พิมพ์สินค้าซ้ำ → มี autocomplete" />
          <TipRow icon="🎨" text="เปลี่ยนสีที่แถบขวา" />
          <TipRow icon="🖼️" text="คลิกโลโก้/ลายเซ็น อัปโหลดรูป" />
        </div>
      </div>

      {/* Explicit save buttons (cloud docs only) */}
      {(onSaveDraft || onSaveAndIssue) && (
        <div className="border-t border-slate-100 p-3 space-y-2">
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              บันทึก Draft
            </button>
          )}
          {onSaveAndIssue && (
            <button
              onClick={onSaveAndIssue}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ออกเอกสาร
            </button>
          )}
        </div>
      )}

      {/* Preview + Export */}
      <div className="border-t border-slate-100 p-3 space-y-2">
        <button
          onClick={onPreview}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border ${
            isPreview
              ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {isPreview ? 'ออกจาก Preview' : 'ดูตัวอย่าง'}
        </button>

        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: themeColor }}
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

        <button
          onClick={() => void onSignOut()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}

function SaveIndicator({ status, isDirty }: { status: 'saved' | 'saving' | 'unsaved'; isDirty?: boolean }) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        กำลังบันทึก...
      </div>
    )
  }
  if (status === 'saved' && !isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-green-600">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Draft Saved
      </div>
    )
  }
  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-500">
        <div className="h-2 w-2 rounded-full bg-amber-400" />
        มีการเปลี่ยนแปลง
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
      <div className="h-2 w-2 rounded-full bg-slate-200" />
      ยังไม่บันทึก
    </div>
  )
}

function TipRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-sm leading-none mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
