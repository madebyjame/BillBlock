interface EditableFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'date' | 'textarea' | 'number'
  placeholder?: string
  className?: string
}

export default function EditableField({ label, value, onChange, type = 'text', placeholder, className = '' }: EditableFieldProps) {
  const inputClass = 'w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100'
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</label>
      {type === 'textarea'
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${inputClass} resize-none`} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      }
    </div>
  )
}
