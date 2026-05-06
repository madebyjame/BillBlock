/**
 * TableSkeleton — Skeleton loader สำหรับแทนที่ตาราง/รายการระหว่างโหลดข้อมูล
 *
 * ใช้งาน:
 * ```tsx
 * // DocumentListPage (5 คอลัมน์)
 * <TableSkeleton cols={5} rows={6} />
 *
 * // ProductsPage / CustomersPage (มี checkbox)
 * <TableSkeleton cols={5} rows={6} hasCheckbox />
 * ```
 */
export default function TableSkeleton({
  rows = 6,
  cols = 4,
  hasCheckbox = false,
}: {
  rows?: number
  cols?: number
  hasCheckbox?: boolean
}) {
  // แต่ละ col มีความกว้างที่ต่างกันเพื่อให้ดูเหมือนข้อความจริง
  const COL_WIDTHS = ['w-36', 'w-28', 'w-20', 'w-24', 'w-16', 'w-12', 'w-10', 'w-8']
  const colWidths = Array.from({ length: cols }, (_, i) => COL_WIDTHS[i % COL_WIDTHS.length])

  return (
    <div className="animate-pulse" aria-label="กำลังโหลด...">
      {/* ─── Header row ─── */}
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
        {hasCheckbox && (
          <div className="h-4 w-4 shrink-0 rounded bg-slate-200" />
        )}
        {colWidths.map((w, i) => (
          <div key={i} className={`h-2.5 rounded-full bg-slate-200 ${w}`} />
        ))}
        {/* action col placeholder */}
        <div className="ml-auto h-2.5 w-6 shrink-0 rounded-full bg-slate-100" />
      </div>

      {/* ─── Data rows ─── */}
      {Array.from({ length: rows }, (_, rowIdx) => {
        // แต่ละแถวมีความกว้างที่แตกต่างกันเล็กน้อยเพื่อความเป็นธรรมชาติ
        const jitter = (rowIdx * 7) % 3  // 0, 1 หรือ 2 — เลื่อน widths
        const opacity = Math.max(0.35, 1 - rowIdx * 0.1)

        return (
          <div
            key={rowIdx}
            className="flex items-center gap-4 border-b border-slate-50 px-4 py-3.5 last:border-0"
            style={{ opacity }}
          >
            {hasCheckbox && (
              <div className="h-4 w-4 shrink-0 rounded bg-slate-100" />
            )}
            {colWidths.map((w, colIdx) => {
              // คอลัมน์แรกสว่างกว่า (เหมือนชื่อ/ข้อความหลัก)
              const bgCls = colIdx === 0 ? 'bg-slate-200' : 'bg-slate-100'
              // เพิ่ม jitter เล็กน้อยให้แต่ละแถวดูต่างกัน
              const adjustedWidth = COL_WIDTHS[
                (colWidths.indexOf(w) + jitter) % COL_WIDTHS.length
              ] ?? w
              return (
                <div
                  key={colIdx}
                  className={`h-3.5 rounded-full ${bgCls} ${adjustedWidth}`}
                />
              )
            })}
            {/* kebab / action placeholder */}
            <div className="ml-auto h-6 w-6 shrink-0 rounded-lg bg-slate-100" />
          </div>
        )
      })}
    </div>
  )
}
