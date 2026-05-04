interface ToggleFieldProps {
  label: string
  visible: boolean
  onToggle: () => void
}

/** ปุ่ม Show/Hide ที่ใช้ใน Sidebar Settings สำหรับแต่ละ field */
export default function ToggleField({ label, visible, onToggle }: ToggleFieldProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
        visible
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
    >
      <span>{label}</span>
      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        visible ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
      }`}>
        {visible ? 'แสดง' : 'ซ่อน'}
      </span>
    </button>
  )
}
