export function Pagination({ page, totalPages, total, onPage }: {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-400">{total} รายการ</p>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">‹ ก่อนหน้า</button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1 text-xs text-slate-300">…</span>
          : <button key={p} onClick={() => onPage(p as number)} className={`min-w-7 rounded-lg px-2 py-1 text-xs transition-colors ${p === page ? 'bg-slate-800 font-semibold text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
        )}
        <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">ถัดไป ›</button>
      </div>
    </div>
  )
}
