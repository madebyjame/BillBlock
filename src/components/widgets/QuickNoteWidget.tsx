import React, { useState, useEffect, useRef } from 'react'
import { StickyNote } from 'lucide-react'

const NOTE_KEY = 'billblock_quick_note'
const MAX_CHARS = 500

function loadNote(): string {
  try { return localStorage.getItem(NOTE_KEY) ?? '' } catch { return '' }
}

export default function QuickNoteWidget() {
  const [text, setText] = useState<string>(loadNote)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, MAX_CHARS)
    setText(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try { localStorage.setItem(NOTE_KEY, val) } catch { /* ignore */ }
    }, 600)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="flex h-full flex-col rounded-2xl bg-amber-50 -m-5 md:-m-5 p-5">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote size={14} className="text-amber-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">โน้ตด่วน</p>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="จดบันทึกอะไรก็ได้...&#10;เช่น วันศุกร์ตามยอดคุณ A, อย่าลืมสั่งของเพิ่ม"
        className="flex-1 resize-none bg-transparent text-sm text-amber-900 placeholder-amber-300 focus:outline-none leading-relaxed"
      />
      <p className="mt-1 text-right text-[10px] text-amber-400">
        {text.length}/{MAX_CHARS}
      </p>
    </div>
  )
}
