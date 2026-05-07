import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, FileUp, Box } from 'lucide-react'
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

const EMPTY_FORM: ProductInput = { name: '', price: 0, unit: '', stock: 0, category: '' }
const PAGE_SIZE = 10

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth()
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

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => { void loadRows() }, [])
  useEffect(() => { setPage(1) }, [search, filterCategory])
  useEffect(() => { setSelectedIds(new Set()) }, [page])

  async function loadRows() {
    setLoading(true)
    try { setRows(await listProducts()) }
    catch { toast.error('โหลดรายการสินค้าไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  const categories = useMemo(() => {
    const cats = [...new Set(rows.map(r => r.category).filter(Boolean))].sort()
    return cats
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.unit.toLowerCase().includes(q)) return false
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
      next.has(id) ? next.delete(id) : next.add(id)
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
    setForm({ name: row.name, price: row.price, unit: row.unit, stock: row.stock, category: row.category })
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

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">สินค้า</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('ฟีเจอร์นำเข้า Excel กำลังพัฒนา')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileUp size={15} /> นำเข้าจาก Excel
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={16} /> เพิ่มข้อมูลใหม่
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า/บริการ หรือ หน่วย"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
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
        {loading ? <TableSkeleton cols={5} rows={6} hasCheckbox /> : (<>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                </th>
                <th className="px-4 py-3 font-semibold">ชื่อสินค้า/บริการ</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold">หน่วย</th>
                <th className="px-4 py-3 text-right font-semibold">คงเหลือ</th>
                <th className="px-4 py-3 text-right font-semibold">ราคา/หน่วย</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Box size={22} />}
                      title={rows.length === 0 ? 'ยังไม่มีข้อมูลสินค้า' : 'ไม่พบสินค้าที่ตรงกับเงื่อนไข'}
                      description={
                        rows.length === 0
                          ? 'คลิก "เพิ่มข้อมูลใหม่" เพื่อเพิ่มสินค้าหรือบริการรายการแรก'
                          : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'
                      }
                    />
                  </td>
                </tr>
              ) : paginated.map(row => (
                <tr key={row.id} className={`border-t border-slate-100 transition-colors ${selectedIds.has(row.id) ? 'bg-slate-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                  <td className="px-4 py-3 text-slate-500">{row.category || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{row.unit || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${row.stock === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {row.stock.toLocaleString('th-TH')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {row.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <KebabMenu onEdit={() => openEdit(row)} onDelete={() => void onDelete(row.id)} deleteLabel="ลบสินค้า" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
        </>)}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มข้อมูลสินค้า'}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField label="ชื่อสินค้า/บริการ">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
              <FormField label="หมวดหมู่">
                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="เช่น อาหาร, อุปกรณ์สำนักงาน"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
              <FormField label="หน่วย">
                <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
              <FormField label="จำนวนคงเหลือ (Stock)">
                <input type="number" min={0} value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
              <FormField label="ราคา/หน่วย">
                <input type="number" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
            </div>
            <div className="mt-5 flex justify-end gap-2">
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

