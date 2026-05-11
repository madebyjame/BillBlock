import { useState, useRef, useEffect } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { type DateRange, type DateRangeKey, getDateRange } from '../types/dashboard'

interface DateRangePickerProps {
  value: DateRange
  onChange: (r: DateRange) => void
}

const PRESETS: { key: Exclude<DateRangeKey, 'custom'>; label: string }[] = [
  { key: 'today',        label: 'วันนี้' },
  { key: '7d',           label: '7 วัน' },
  { key: '30d',          label: '30 วัน' },
  { key: 'this-month',   label: 'เดือนนี้' },
  { key: 'this-quarter', label: 'ไตรมาส' },
  { key: 'this-year',    label: 'ปีนี้' },
  { key: 'all-time',     label: 'ทั้งหมด' },
]

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(value.from)
  const [customTo, setCustomTo] = useState(value.to)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    if (!showCustom) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCustom])

  function handlePreset(key: Exclude<DateRangeKey, 'custom'>) {
    onChange(getDateRange(key))
  }

  function handleCustomConfirm() {
    if (!customFrom || !customTo) return
    onChange(getDateRange('custom', customFrom, customTo))
    setShowCustom(false)
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => handlePreset(p.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value.key === p.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {p.label}
        </button>
      ))}

      {/* Custom button */}
      <div ref={popoverRef} className="relative">
        <button
          onClick={() => setShowCustom(v => !v)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value.key === 'custom'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CalendarDays size={11} />
          {value.key === 'custom' ? value.from + ' – ' + value.to : 'กำหนดเอง...'}
        </button>

        {showCustom && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">กำหนดช่วงวันที่</p>
              <button
                onClick={() => setShowCustom(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  จาก
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  ถึง
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCustomConfirm}
                disabled={!customFrom || !customTo || customFrom > customTo}
                className="mt-1 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
