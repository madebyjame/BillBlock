interface EditableFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date' | 'textarea' | 'number'
  placeholder?: string
  className?: string
}

/** Input field ที่ใช้ซ้ำทั่ว Block ทุกตัว */
export default function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
}: EditableFieldProps) {
  const baseClass =
    'w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${baseClass} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  )
}
