import { useRef, useState } from 'react'

interface InlineEditProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  inputClassName?: string
}

/**
 * คลิกแล้วแก้ไขได้ทันที (contenteditable-style แต่ใช้ input/textarea จริง)
 * เมื่อ blur หรือ Enter จะ confirm การแก้ไข
 */
export default function InlineEdit({
  value,
  onChange,
  placeholder = 'คลิกเพื่อแก้ไข',
  className = '',
  multiline = false,
  inputClassName = '',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  function startEdit() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setEditing(false); setDraft(value) }
  }

  const displayClass = `group/field relative cursor-text rounded px-1 py-0.5 hover:bg-blue-50/60 hover:ring-1 hover:ring-blue-200 ${className}`

  if (editing) {
    const sharedProps = {
      ref: inputRef as never,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKey,
      className: `w-full rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm shadow-sm outline-none ring-2 ring-blue-100 ${inputClassName}`,
      autoFocus: true,
    }
    return multiline
      ? <textarea {...sharedProps} rows={3} className={`${sharedProps.className} resize-none`} />
      : <input {...sharedProps} type="text" />
  }

  return (
    <div className={displayClass} onClick={startEdit}>
      {value || <span className="text-slate-300 italic">{placeholder}</span>}
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100">
        <PencilIcon />
      </span>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg className="h-3 w-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
