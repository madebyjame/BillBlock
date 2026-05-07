import { useEffect, useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import { toast } from 'sonner'
import TableSkeleton from '../components/TableSkeleton'
import { Pagination } from '../components/Pagination'
import { listAllMovements, type StockMovementRow } from '../lib/stockApi'
import { listProducts, type ProductRow } from '../lib/productApi'

const PAGE_SIZE = 20

const TYPE_META: Record<string, { label: string; cls: string; sign: string }> = {
  IN:     { label: 'รับเข้า',  cls: 'bg-green-100 text-green-700',  sign: '+' },
  OUT:    { label: 'ตัดออก',   cls: 'bg-red-100 text-red-600',      sign: '−' },
  ADJUST: { label: 'ปรับปรุง', cls: 'bg-blue-100 text-blue-600',    sign: '±' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function StockMovementPage() {
  const [movements, setMovements] = useState<StockMovementRow[]>([])
  const [products, setProducts] = useState<Map<string, ProductRow>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const [mvs, prods] = await Promise.all([listAllMovements(), listProducts()])
        setMovements(mvs)
        setProducts(new Map(prods.map(p => [p.id, p])))
      } catch { toast.error('โหลดประวัติสต็อกไม่สำเร็จ') }
      finally { setLoading(false) }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return movements.filter(m => {
      if (filterType !== 'all' && m.movement_type !== filterType) return false
      if (q) {
        const prod = products.get(m.product_id)
        const prodName = prod?.name.toLowerCase() ?? ''
        const prodSku  = prod?.sku.toLowerCase() ?? ''
        if (!prodName.includes(q) && !prodSku.includes(q) && !m.reference_document.toLowerCase().includes(q) && !m.note.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [movements, products, search, filterType])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <History size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ประวัติสต็อก</h1>
          <p className="text-sm text-slate-400">บันทึกการเคลื่อนไหวทั้งหมด ({movements.length} รายการ)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหาสินค้า / SKU / อ้างอิง / หมายเหตุ"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-400"
        >
          <option value="all">ทุกประเภท</option>
          <option value="IN">รับเข้า</option>
          <option value="OUT">ตัดออก</option>
          <option value="ADJUST">ปรับปรุง</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? <TableSkeleton cols={7} rows={8} /> : (<>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">วันที่</th>
                  <th className="px-4 py-3 font-semibold">สินค้า</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 text-right font-semibold">จำนวน</th>
                  <th className="px-4 py-3 text-right font-semibold">คงเหลือหลัง</th>
                  <th className="px-4 py-3 font-semibold">อ้างอิง</th>
                  <th className="px-4 py-3 font-semibold">หมายเหตุ</th>
                  <th className="px-4 py-3 font-semibold">โดย</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <History size={32} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">{movements.length === 0 ? 'ยังไม่มีประวัติสต็อก' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}</p>
                    </td>
                  </tr>
                ) : paginated.map(m => {
                  const meta = TYPE_META[m.movement_type] ?? TYPE_META['ADJUST']
                  const prod = products.get(m.product_id)
                  return (
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{prod?.name ?? m.product_id.slice(0, 8)}</p>
                        {prod?.sku && <p className="text-[11px] text-slate-400">SKU: {prod.sku}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${m.movement_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                        {meta.sign}{m.quantity.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {m.balance_after.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{m.reference_document || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px]">
                        <p className="truncate">{m.note || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px]">
                        <p className="truncate">{m.created_by}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={p => setPage(p)} />
        </>)}
      </div>
    </div>
  )
}
