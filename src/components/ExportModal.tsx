import { useState, useEffect } from 'react'

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg'
  quality: 'standard' | 'high' | 'ultra'
  paperSize: 'a4' | 'letter'
  filename: string
}

export interface ExportProgress {
  stage: 'idle' | 'preparing' | 'rendering' | 'generating' | 'saving' | 'done' | 'error'
  percent: number
  message: string
  errorMsg?: string
}

interface Props {
  open: boolean
  progress: ExportProgress
  themeColor: string
  onClose: () => void
  onExport: (options: ExportOptions) => void
  defaultFilename?: string
}

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'มาตรฐาน', desc: 'เร็ว · เหมาะกับแชร์ออนไลน์', scale: 1.5 },
  { value: 'high',     label: 'คมชัด',   desc: 'แนะนำ · สมดุลขนาด/คุณภาพ', scale: 2 },
  { value: 'ultra',    label: 'สูงสุด',  desc: 'ช้ากว่า · เหมาะกับพิมพ์จริง', scale: 3 },
] as const

const STEPS = [
  { stage: 'preparing',  label: 'เตรียมเอกสาร' },
  { stage: 'rendering',  label: 'Render ภาพ' },
  { stage: 'generating', label: 'สร้างไฟล์' },
  { stage: 'saving',     label: 'บันทึก' },
  { stage: 'done',       label: 'เสร็จแล้ว' },
] as const

// ประมาณขนาดไฟล์คร่าวๆ (MB)
function estimateSize(format: ExportOptions['format'], quality: ExportOptions['quality']): string {
  const scaleMap = { standard: 1.5, high: 2, ultra: 3 }
  const scale = scaleMap[quality]
  const baseKB = format === 'pdf' ? 300 : format === 'png' ? 800 : 200
  const estimated = baseKB * (scale / 1.5) * (format === 'png' ? 1.5 : 1)
  return estimated > 1000
    ? `~${(estimated / 1024).toFixed(1)} MB`
    : `~${Math.round(estimated)} KB`
}

export default function ExportModal({ open, progress, themeColor, onClose, onExport, defaultFilename = 'bill-block-document' }: Props) {
  const [format, setFormat] = useState<ExportOptions['format']>('pdf')
  const [quality, setQuality] = useState<ExportOptions['quality']>('high')
  const [paperSize, setPaperSize] = useState<ExportOptions['paperSize']>('a4')
  const [filename, setFilename] = useState(defaultFilename)

  const isRunning = progress.stage !== 'idle' && progress.stage !== 'done' && progress.stage !== 'error'
  const isDone = progress.stage === 'done'
  const isError = progress.stage === 'error'

  // รีเซ็ตเมื่อเปิด modal ใหม่
  useEffect(() => {
    if (open) setFilename(defaultFilename)
  }, [open, defaultFilename])

  // ปิดอัตโนมัติเมื่อ done (หลัง 1.5 วินาที)
  useEffect(() => {
    if (isDone) {
      const t = setTimeout(onClose, 1800)
      return () => clearTimeout(t)
    }
  }, [isDone, onClose])

  if (!open) return null

  const currentStepIdx = STEPS.findIndex(s => s.stage === progress.stage)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={!isRunning ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: themeColor + '15' }}>
                <ExportIcon color={themeColor} />
              </div>
              <h2 className="font-semibold text-slate-800">Export เอกสาร</h2>
            </div>
            {!isRunning && (
              <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="p-6 space-y-5 flex-1 overflow-y-auto">

            {/* ─── ชื่อไฟล์ ─── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">ชื่อไฟล์</label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                <input
                  type="text"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 border-0 bg-transparent text-sm text-slate-700 focus:outline-none disabled:opacity-50"
                />
                <span className="text-xs text-slate-400 font-mono">.{format}</span>
              </div>
            </div>

            {/* ─── รูปแบบไฟล์ ─── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">รูปแบบ</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'png', 'jpg'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => !isRunning && setFormat(f)}
                    className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${
                      format === f ? 'border-transparent text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                    style={format === f ? { backgroundColor: themeColor } : {}}
                  >
                    <div className="text-base font-bold">{f.toUpperCase()}</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${format === f ? 'text-white/80' : 'text-slate-400'}`}>
                      {f === 'pdf' ? 'เอกสาร' : f === 'png' ? 'ภาพใส' : 'ภาพถ่าย'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── ขนาดกระดาษ (เฉพาะ PDF) ─── */}
            {format === 'pdf' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">ขนาดกระดาษ</label>
                <div className="flex gap-2">
                  {(['a4', 'letter'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => !isRunning && setPaperSize(size)}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                        paperSize === size ? 'border-transparent text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                      style={paperSize === size ? { backgroundColor: themeColor } : {}}
                    >
                      {size === 'a4' ? 'A4 (210×297mm)' : 'Letter (216×279mm)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── คุณภาพ ─── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">คุณภาพ</label>
              <div className="space-y-1.5">
                {QUALITY_OPTIONS.map(q => (
                  <button
                    key={q.value}
                    onClick={() => !isRunning && setQuality(q.value)}
                    className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                      quality === q.value ? 'border-transparent' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                    style={quality === q.value ? { backgroundColor: themeColor + '12', borderColor: themeColor + '60' } : {}}
                  >
                    <div>
                      <span className="text-sm font-semibold text-slate-700">{q.label}</span>
                      <span className="ml-2 text-xs text-slate-400">{q.desc}</span>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      quality === q.value ? 'border-transparent' : 'border-slate-300'
                    }`}
                      style={quality === q.value ? { backgroundColor: themeColor } : {}}
                    >
                      {quality === q.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── ขนาดโดยประมาณ ─── */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="text-slate-500">ขนาดไฟล์โดยประมาณ</span>
              <span className="font-semibold text-slate-700">{estimateSize(format, quality)}</span>
            </div>

            {/* ─── Progress ─── */}
            {(isRunning || isDone || isError) && (
              <div className="space-y-3">
                {/* Step indicators */}
                <div className="flex items-center justify-between">
                  {STEPS.map((step, idx) => {
                    const isCompleted = currentStepIdx > idx || isDone
                    const isCurrent = currentStepIdx === idx && !isDone
                    return (
                      <div key={step.stage} className="flex flex-col items-center gap-1">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                          isCompleted ? 'text-white' :
                          isCurrent ? 'text-white' :
                          'bg-slate-100 text-slate-400'
                        }`} style={isCompleted || isCurrent ? { backgroundColor: isCompleted ? themeColor : themeColor + 'cc' } : {}}>
                          {isCompleted ? <CheckIcon /> : idx + 1}
                        </div>
                        <span className={`text-[9px] text-center ${isCurrent || isCompleted ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Progress bar */}
                <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percent}%`, backgroundColor: isError ? '#ef4444' : themeColor }}
                  />
                  {isRunning && (
                    <div
                      className="absolute inset-y-0 w-16 rounded-full opacity-40 animate-pulse"
                      style={{ left: `${Math.max(0, progress.percent - 10)}%`, backgroundColor: 'white' }}
                    />
                  )}
                </div>

                {/* Message */}
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isError ? 'text-red-600' : isDone ? 'text-green-600' : 'text-slate-600'}`}>
                    {isDone && '✓ '}
                    {progress.message}
                  </p>
                  <span className="text-sm font-bold tabular-nums" style={{ color: isError ? '#ef4444' : themeColor }}>
                    {progress.percent}%
                  </span>
                </div>

                {isError && progress.errorMsg && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{progress.errorMsg}</p>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              {isDone ? 'ปิด' : 'ยกเลิก'}
            </button>
            <button
              onClick={() => !isRunning && !isDone && onExport({ format, quality, paperSize, filename: filename || defaultFilename })}
              disabled={isRunning || isDone}
              className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              {isRunning
                ? <><SpinIcon /> กำลัง Export...</>
                : isDone
                ? <><CheckIcon /> เสร็จแล้ว!</>
                : <><ExportIcon color="white" /> Export เลย!</>
              }
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

// ─── Icons ───
function ExportIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function SpinIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
