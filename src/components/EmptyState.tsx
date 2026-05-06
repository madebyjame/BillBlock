import type { ReactNode } from 'react'

interface Props {
  /** ไอคอน — ส่งมาเป็น <SomeIcon size={22} /> */
  icon?: ReactNode
  /** หัวข้อหลัก (บังคับ) */
  title: string
  /** คำอธิบายเพิ่มเติม */
  description?: string
  /** ปุ่มหรือ element action */
  action?: ReactNode
  /** ปรับ padding แนวตั้ง (default: py-16) */
  className?: string
}

/**
 * EmptyState — แสดงเมื่อตารางหรือรายการยังว่างเปล่า
 *
 * ใช้งาน:
 * ```tsx
 * <EmptyState
 *   icon={<Box size={22} />}
 *   title="ยังไม่มีข้อมูลสินค้า"
 *   description="คลิก 'เพิ่มข้อมูลใหม่' เพื่อเพิ่มรายการแรก"
 *   action={<button onClick={onAdd}>เพิ่มสินค้า</button>}
 * />
 * ```
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = 'py-16',
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="font-semibold text-slate-600">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
