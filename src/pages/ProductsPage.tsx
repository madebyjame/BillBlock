import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Box, X } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import { KebabMenu } from '../components/KebabMenu'
import { Pagination } from '../components/Pagination'
import { FormField } from '../components/FormField'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  createProduct, deleteProduct, listProducts, updateProduct,
  type ProductInput, type ProductRow,
} from '../lib/productApi'
import { listMovementsByProduct, type StockMovementRow } from '../lib/stockApi'

const EMPTY_FORM: ProductInput = {
  name: '', price: 0, unit: '', stock: 0, category: '',
  sku: '', cost_price: 0, min_stock: 0, description: '', tax_type: 'vat_included',
}
const PAGE_SIZE = 10

const TAX_TYPE_LABEL: Record<string, string> = {
  vat_included: 'รวม VAT 7%',
  vat_excluded: 'แยก VAT 7%',
  vat_exempt:   'ยกเว้น VAT',
}

function stockIndicator(stock: number, minStock: number) {
  if (stock === 0) return { cls: 'text-red-600 font-semibold', badge: 'bg-red-100 text-red-600', label: 'หมดสต็อก' }
  if (stock <= minStock) return { cls: 'text-orange-500 font-semibold', badge: 'bg-orange-100 text-orange-600', label: 'เหลือน้อย' }
  return { cls: 'text-green-600 font-semibold', badge: 'bg-green-100 text-green-700', label: 'ปกติ' }
}

// ─── Stock History Modal ───────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const TYPE_META: Record<string, { label: string; cls: string; sign: string }> = {
  IN:     { label: 'รับเข้า',    cls: 'bg-green-100 text-green-700',  sign: '+' },
  OUT:    { label: 'ตัดออก',     cls: 'bg-red-100 text-red-600',      sign: '−' },
  ADJUST: { label: 'ปรับปรุง',   cls: 'bg-blue-100 text-blue-600',    sign: '±' },
}

function StockHistoryModal({ product, onClose }: { product: ProductRow; onClose: () => void }) {
  const [rows, setRows] = useState<StockMovementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try { setRows(await listMovementsByProduct(product.id)) }
      catch { /* show empty */ }
      finally { setLoading(false) }
    })()
  }, [product.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">ประวัติสต็อก — {product.name}</h2>
            {product.sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>}
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X size={15} className="text-slate-500" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Box size={28} className="mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">ยังไม่มีประวัติการเคลื่อนไหวสต็อก</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">ประเภท</th>
                  <th className="pb-2 text-right font-medium">จำนวน</th>
                  <th className="pb-2 text-right font-medium">คงเหลือ</th>
                  <th className="pb-2 font-medium">อ้างอิง</th>
                  <th className="pb-2 font-medium">หมายเหตุ</th>
                  <th className="pb-2 text-right font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(r => {
                  const meta = TYPE_META[r.movement_type] ?? TYPE_META['ADJUST']
                  return (
                    <tr key={r.id}>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className={`py-2 text-right font-semibold ${r.movement_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                        {meta.sign}{r.quantity.toLocaleString('th-TH')}
                      </td>
                      <td className="py-2 text-right text-slate-700">{r.balance_after.toLocaleString('th-TH')}</td>
                      <td className="py-2 font-mono text-xs text-blue-600">{r.reference_document || '—'}</td>
                      <td className="py-2 text-slate-500 max-w-[140px] truncate">{r.note || '—'}</td>
                      <td className="py-2 text-right text-slate-400 text-[11px] whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => { void loadRows() }, [])

  async function loadRows() {
    setLoading(true)
    try { setRows(await listProducts()) }
    catch { toast.error('โหลดรายการสินค้าไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  const categories = useMemo(() => [...new Set(rows.map(r => r.category).filter(Boolean))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.sku.toLowerCase().includes(q) && !r.unit.toLowerCase().includes(q)) return false
      if (filterCategory !== 'all' && r.category !== filterCategory) return false
      return true
    })
  }, [rows, search, filterCategory])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allPageSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.id))

  function toggleAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) paginated.forEach(r => next.delete(r.id))
      else paginated.forEach(r => next.add(r.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (!confirm(`ลบสินค้า ${selectedIds.size} รายการ?`)) return
    try {
      await Promise.all([...selectedIds].map(id => deleteProduct(id)))
      toast.success(`ลบสินค้า ${selectedIds.size} รายการแล้ว`)
      setSelectedIds(new Set())
      await loadRows()
    } catch { toast.error('ลบไม่สำเร็จ กรุณาลองใหม่') }
  }

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(row: ProductRow) {
    setEditingId(row.id)
    setForm({
      name: row.name, price: row.price, unit: row.unit, stock: row.stock, category: row.category,
      sku: row.sku, cost_price: row.cost_price, min_stock: row.min_stock,
      description: row.description, tax_type: row.tax_type,
    })
    setShowModal(true)
  }

  async function onSubmit() {
    if (!user || saving || !form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) { await updateProduct(editingId, form); toast.success('อัปเดตข้อมูลสินค้าแล้ว') }
      else { await createProduct(user.id, form); toast.success('เพิ่มข้อมูลสินค้าแล้ว') }
      setShowModal(false)
      await loadRows()
    } catch { toast.error('บันทึกข้อมูลสินค้าไม่สำเร็จ') }
    finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('ลบข้อมูลสินค้านี้?')) return
    try { await deleteProduct(id); toast.success('ลบข้อมูลสินค้าแล้ว'); await loadRows() }
    catch { toast.error('ลบไม่สำเร็จ') }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">รายการสินค้า</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/inventory/adjustments')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            รับเข้า/ปรับสต็อก
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={16} /> เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหาชื่อสินค้า / SKU / หน่วย"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400"
        >
          <option value="all">ทุกหมวดหมู่</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2.5">
          <span className="text-sm text-white">เลือก {selectedIds.size} รายการ</span>
          <button onClick={() => void handleBulkDelete()} className="text-sm font-medium text-red-400 hover:text-red-300">
            ลบที่เลือก
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? <TableSkeleton cols={7} rows={6} hasCheckbox /> : (<>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </th>
                  <th className="px-4 py-3 font-semibold">ชื่อสินค้า/บริการ</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold">หน่วย</th>
                  <th className="px-4 py-3 text-right font-semibold">คงเหลือ</th>
                  <th className="px-4 py-3 text-right font-semibold">ต้นทุน</th>
                  <th className="px-4 py-3 text-right font-semibold">ราคา/หน่วย</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={<Box size={22} />}
                        title={rows.length === 0 ? 'ยังไม่มีข้อมูลสินค้า' : 'ไม่พบสินค้าที่ตรงกับเงื่อนไข'}
                        description={
                          rows.length === 0
                            ? 'คลิก "เพิ่มสินค้าใหม่" เพื่อเพิ่มสินค้าหรือบริการรายการแรก'
                            : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'
                        }
                      />
                    </td>
                  </tr>
                ) : paginated.map(row => {
                  const { cls, badge, label } = stockIndicator(row.stock, row.min_stock)
                  return (
                    <tr key={row.id} className={`border-t border-slate-100 transition-colors ${selectedIds.has(row.id) ? 'bg-slate-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)}
                          className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700">{row.name}</p>
                        {row.description && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{row.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.sku || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{row.category || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{row.unit || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col items-end gap-0.5">
                          <span className={cls}>{row.stock.toLocaleString('th-TH')}</span>
                          {row.stock <= row.min_stock && (
                            <span className={`rounded-full px-1.5 py-0 text-[9px] font-medium ${badge}`}>{label}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {row.cost_price > 0
                          ? row.cost_price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <KebabMenu
                          onEdit={() => openEdit(row)}
                          onDelete={() => void onDelete(row.id)}
                          deleteLabel="ลบสินค้า"
                          extraItems={[{ label: 'ดูประวัติสต็อก', onClick: () => setHistoryProduct(row) }]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={p => { setPage(p); setSelectedIds(new Set()) }} />
        </>)}
      </div>

      {/* Stock History Modal */}
      {historyProduct && (
        <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มข้อมูลสินค้า'}
            </h2>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ข้อมูลทั่วไป</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
              <FormField label="ชื่อสินค้า/บริการ *">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="SKU (รหัสสินค้า)">
                <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                  placeholder="เช่น PRD-001" className={inputCls} />
              </FormField>
              <FormField label="หมวดหมู่">
                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="เช่น อาหาร, อุปกรณ์สำนักงาน" className={inputCls} />
              </FormField>
              <FormField label="หน่วย">
                <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="เช่น ชิ้น, กก., ลัง" className={inputCls} />
              </FormField>
              <FormField label="ประเภทภาษี (Tax Type)">
                <select value={form.tax_type} onChange={e => setForm(p => ({ ...p, tax_type: e.target.value }))} className={inputCls}>
                  <option value="vat_included">รวม VAT 7%</option>
                  <option value="vat_excluded">แยก VAT 7%</option>
                  <option value="vat_exempt">ยกเว้น VAT</option>
                </select>
              </FormField>
              <div className="md:col-span-2">
                <FormField label="รายละเอียดสินค้า">
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} className={`${inputCls} resize-none`} placeholder="รายละเอียดเพิ่มเติม..." />
                </FormField>
              </div>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ราคาและสต็อก</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-5">
              <FormField label="ราคาขาย/หน่วย (฿)">
                <input type="number" min={0} step="0.01" value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) || 0 }))} className={inputCls} />
              </FormField>
              <FormField label="ราคาต้นทุน (Cost Price) (฿)">
                <input type="number" min={0} step="0.01" value={form.cost_price}
                  onChange={e => setForm(p => ({ ...p, cost_price: Number(e.target.value) || 0 }))} className={inputCls} />
              </FormField>
              <FormField label="จำนวนคงเหลือ (Stock)">
                <input type="number" min={0} value={form.stock}
                  onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) || 0 }))} className={inputCls} />
              </FormField>
              <FormField label="สต็อกขั้นต่ำ (Min Stock Alert)">
                <input type="number" min={0} value={form.min_stock}
                  onChange={e => setForm(p => ({ ...p, min_stock: Number(e.target.value) || 0 }))}
                  placeholder="0 = ไม่แจ้งเตือน" className={inputCls} />
              </FormField>
            </div>

            {form.tax_type && (
              <p className="mb-4 text-xs text-slate-500">
                ภาษี: <span className="font-medium text-slate-700">{TAX_TYPE_LABEL[form.tax_type]}</span>
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">ยกเลิก</button>
              <button onClick={() => void onSubmit()} disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: themeColor }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
