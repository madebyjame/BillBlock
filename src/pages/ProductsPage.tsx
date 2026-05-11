import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileUp, Box, Lock, X, ArrowLeftRight } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import { KebabMenu } from '../components/KebabMenu'
import { Pagination } from '../components/Pagination'
import { FormField } from '../components/FormField'
import UpgradeModal from '../components/UpgradeModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../hooks/useConfirm'
import {
  computeCommittedQtys, createProduct, deleteProduct, listProducts, updateProduct, uploadProductImage,
  type ProductInput, type ProductRow,
} from '../lib/productApi'
import { PlanLimitError } from '../lib/planLimits'
import { usePlan } from '../hooks/usePlan'
import { listMovementsByProduct, recordStockMovement, type MovementType, type StockMovementRow } from '../lib/stockApi'

const EMPTY_FORM: ProductInput = {
  name: '', price: 0, unit: '', stock: 0, category: '',
  sku: '', cost_price: 0, min_stock: 0, description: '', tax_type: 'vat_included', image_url: '',
}
const PAGE_SIZE = 10

const TAX_TYPE_LABEL: Record<string, string> = {
  vat_included: 'รวม VAT 7%',
  vat_excluded: 'แยก VAT 7%',
  vat_exempt:   'ยกเว้น VAT',
}

function stockCls(val: number, minStock: number) {
  if (val < 0)                         return 'text-red-700 font-bold'
  if (minStock > 0 && val <= minStock) return 'text-orange-500 font-semibold'
  if (val === 0)                       return 'text-slate-400 font-medium'
  return 'text-green-600 font-semibold'
}

// Deterministic pastel avatar — shows thumbnail if image_url available
function ProductAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className="h-9 w-9 flex-shrink-0 rounded-lg object-cover border border-slate-100" />
  }
  const initials = name.trim().slice(0, 2).toUpperCase() || '?'
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold select-none"
      style={{ backgroundColor: `hsl(${hue},38%,88%)`, color: `hsl(${hue},38%,36%)` }}>
      {initials}
    </div>
  )
}

// ─── Stock History Modal ───────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const TYPE_META: Record<string, { label: string; cls: string; sign: string }> = {
  IN:     { label: 'รับเข้า',  cls: 'bg-green-100 text-green-700', sign: '+' },
  OUT:    { label: 'ตัดออก',   cls: 'bg-red-100 text-red-600',     sign: '−' },
  ADJUST: { label: 'ปรับปรุง', cls: 'bg-blue-100 text-blue-600',   sign: '±' },
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
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
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
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}>{meta.label}</span></td>
                      <td className={`py-2 text-right font-semibold ${r.movement_type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>{meta.sign}{r.quantity.toLocaleString('th-TH')}</td>
                      <td className="py-2 text-right text-slate-700">{r.balance_after.toLocaleString('th-TH')}</td>
                      <td className="py-2 font-mono text-xs text-blue-600">{r.reference_document || '—'}</td>
                      <td className="py-2 text-slate-500 max-w-[120px] truncate">{r.note || '—'}</td>
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

// ─── Quick Adjust Modal ────────────────────────────────────────────────────────

function QuickAdjustModal({ product, onClose, onDone }: {
  product: ProductRow; onClose: () => void; onDone: () => void
}) {
  const [type, setType] = useState<MovementType>('IN')
  const [qty, setQty] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const preview = qty !== '' && qty > 0
    ? (type === 'OUT' ? product.stock - qty : product.stock + qty)
    : null

  async function submit() {
    if (!qty || qty <= 0 || !note.trim()) return
    if (type === 'OUT' && qty > product.stock) { toast.error(`สต็อกไม่เพียงพอ (คงเหลือ ${product.stock})`); return }
    setSaving(true)
    try {
      await recordStockMovement({ product_id: product.id, movement_type: type, quantity: qty, note: note.trim() })
      toast.success(`ปรับสต็อก "${product.name}" สำเร็จ`)
      onDone()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Quick Adjust</h2>
            <p className="text-xs text-slate-400">{product.name} · คงเหลือ {product.stock} {product.unit}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(['IN', 'OUT', 'ADJUST'] as MovementType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                type === t
                  ? t === 'IN'  ? 'border-green-400 bg-green-50 text-green-700'
                  : t === 'OUT' ? 'border-red-400 bg-red-50 text-red-700'
                  :               'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}>
              {t === 'IN' ? 'รับเข้า' : t === 'OUT' ? 'ตัดออก' : 'ปรับ'}
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <FormField label="จำนวน *">
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} placeholder="0" />
          </FormField>
          <FormField label="ยอดหลังปรับ">
            <div className={`flex h-[38px] items-center rounded-lg border px-3 text-sm font-semibold ${
              preview === null ? 'border-slate-200 text-slate-400'
              : preview < 0   ? 'border-red-300 bg-red-50 text-red-600'
              :                  'border-green-300 bg-green-50 text-green-700'
            }`}>
              {preview === null ? '—' : preview < 0 ? `ติดลบ (${preview})` : preview.toLocaleString('th-TH')}
            </div>
          </FormField>
        </div>

        <FormField label="หมายเหตุ *">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="ระบุเหตุผล..." className={inputCls} />
        </FormField>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600">ยกเลิก</button>
          <button onClick={() => void submit()} disabled={saving || !qty || !note.trim()}
            className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {saving ? 'บันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth()
  const { isBusiness } = usePlan()
  const { confirm, pending: confirmPending, onConfirm, onCancel } = useConfirm()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [committedMap, setCommittedMap] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{ resource: 'products'; limit: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null)
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<ProductRow | null>(null)
  const [bulkAction, setBulkAction] = useState<'category' | 'minstock' | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')   // local dataURL for preview
  const [imageFile, setImageFile] = useState<File | null>(null)  // pending upload

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => { void loadRows() }, [])

  async function loadRows() {
    setLoading(true)
    try {
      const [prods, committed] = await Promise.all([listProducts(), computeCommittedQtys()])
      setRows(prods)
      setCommittedMap(committed)
    } catch { toast.error('โหลดรายการสินค้าไม่สำเร็จ') }
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
    if (!await confirm({ message: `สินค้า ${selectedIds.size} รายการจะถูกลบถาวร`, confirmLabel: `ลบ ${selectedIds.size} รายการ`, danger: true })) return
    try {
      await Promise.all([...selectedIds].map(id => deleteProduct(id)))
      toast.success(`ลบสินค้า ${selectedIds.size} รายการแล้ว`)
      setSelectedIds(new Set())
      await loadRows()
    } catch { toast.error('ลบไม่สำเร็จ กรุณาลองใหม่') }
  }

  function rowToInput(row: ProductRow): ProductInput {
    return { name: row.name, price: row.price, unit: row.unit, stock: row.stock, category: row.category, sku: row.sku, cost_price: row.cost_price, min_stock: row.min_stock, description: row.description, tax_type: row.tax_type, image_url: row.image_url }
  }

  async function handleBulkCategory() {
    const cat = bulkValue.trim()
    if (!cat) return
    setBulkSaving(true)
    try {
      await Promise.all([...selectedIds].map(id => {
        const row = rows.find(r => r.id === id)
        return row ? updateProduct(id, { ...rowToInput(row), category: cat }) : Promise.resolve()
      }))
      toast.success(`เปลี่ยนหมวดหมู่ ${selectedIds.size} รายการแล้ว`)
      setBulkAction(null); setBulkValue(''); setSelectedIds(new Set())
      await loadRows()
    } catch { toast.error('อัปเดตไม่สำเร็จ') }
    finally { setBulkSaving(false) }
  }

  async function handleBulkMinStock() {
    const val = Number(bulkValue)
    if (isNaN(val) || val < 0) return
    setBulkSaving(true)
    try {
      await Promise.all([...selectedIds].map(id => {
        const row = rows.find(r => r.id === id)
        return row ? updateProduct(id, { ...rowToInput(row), min_stock: val }) : Promise.resolve()
      }))
      toast.success(`ตั้งค่า Min Stock ${selectedIds.size} รายการแล้ว`)
      setBulkAction(null); setBulkValue(''); setSelectedIds(new Set())
      await loadRows()
    } catch { toast.error('อัปเดตไม่สำเร็จ') }
    finally { setBulkSaving(false) }
  }

  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setImagePreview(''); setImageFile(null); setShowModal(true)
  }
  function openEdit(row: ProductRow) {
    setEditingId(row.id)
    setForm(rowToInput(row))
    setImagePreview(row.image_url)
    setImageFile(null)
    setShowModal(true)
  }

  async function onSubmit() {
    if (!user || saving || !form.name.trim()) return
    setSaving(true)
    try {
      let finalForm = form
      if (editingId) {
        // upload image first if new file selected
        if (imageFile) {
          const url = await uploadProductImage(user.id, editingId, imageFile)
          finalForm = { ...form, image_url: url }
        }
        await updateProduct(editingId, finalForm)
        toast.success('อัปเดตข้อมูลสินค้าแล้ว')
      } else {
        // create → get id → upload → update image_url
        const newId = await createProduct(user.id, finalForm)
        if (imageFile) {
          const url = await uploadProductImage(user.id, newId, imageFile)
          await updateProduct(newId, { ...finalForm, image_url: url })
        }
        toast.success('เพิ่มข้อมูลสินค้าแล้ว')
      }
      setShowModal(false)
      await loadRows()
    } catch (err) {
      if (err instanceof PlanLimitError) {
        setShowModal(false)
        setUpgradeModal({ resource: 'products', limit: err.limit })
      } else {
        toast.error('บันทึกข้อมูลสินค้าไม่สำเร็จ')
      }
    }
    finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!await confirm({ message: 'ข้อมูลสินค้านี้จะถูกลบถาวร', confirmLabel: 'ลบสินค้า', danger: true })) return
    try { await deleteProduct(id); toast.success('ลบข้อมูลสินค้าแล้ว'); await loadRows() }
    catch { toast.error('ลบไม่สำเร็จ') }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {confirmPending && <ConfirmDialog {...confirmPending} onConfirm={onConfirm} onCancel={onCancel} />}
      {upgradeModal && (
        <UpgradeModal
          resource={upgradeModal.resource}
          limit={upgradeModal.limit}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">รายการสินค้า</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => isBusiness
              ? toast.info('ฟีเจอร์นำเข้า Excel กำลังพัฒนา')
              : toast.error('ฟีเจอร์นี้สำหรับแผน Business เท่านั้น')
            }
            title={isBusiness ? undefined : 'ต้องการแผน Business'}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              isBusiness
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isBusiness ? <FileUp size={15} /> : <Lock size={15} />}
            นำเข้าจาก Excel
          </button>
          <button onClick={() => navigate('/inventory/adjustments')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <ArrowLeftRight size={14} /> รับเข้า/ปรับสต็อก
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}>
            <Plus size={16} /> เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหาชื่อสินค้า / SKU / หน่วย"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400" />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-slate-400">
          <option value="all">ทุกหมวดหมู่</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm font-medium text-white">เลือก {selectedIds.size} รายการ</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setBulkAction(bulkAction === 'category' ? null : 'category'); setBulkValue('') }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${bulkAction === 'category' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                เปลี่ยนหมวดหมู่
              </button>
              <button
                onClick={() => { setBulkAction(bulkAction === 'minstock' ? null : 'minstock'); setBulkValue('') }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${bulkAction === 'minstock' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                ตั้งค่า Min Stock
              </button>
              <div className="mx-1 h-4 w-px bg-slate-600" />
              <button onClick={() => void handleBulkDelete()} className="rounded-md px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors">
                ลบที่เลือก
              </button>
              <button onClick={() => { setSelectedIds(new Set()); setBulkAction(null) }} className="ml-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-600">
                <X size={12} className="text-slate-400" />
              </button>
            </div>
          </div>
          {bulkAction === 'category' && (
            <div className="flex items-center gap-2 border-t border-slate-700 bg-slate-900 px-4 py-2.5">
              <span className="text-xs text-slate-400 shrink-0">หมวดหมู่ใหม่:</span>
              <input
                value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                placeholder="พิมพ์หมวดหมู่..." autoFocus
                className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                list="bulk-category-list"
                onKeyDown={e => e.key === 'Enter' && void handleBulkCategory()}
              />
              <datalist id="bulk-category-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
              <button onClick={() => void handleBulkCategory()} disabled={!bulkValue.trim() || bulkSaving}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 hover:bg-blue-500">
                {bulkSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          )}
          {bulkAction === 'minstock' && (
            <div className="flex items-center gap-2 border-t border-slate-700 bg-slate-900 px-4 py-2.5">
              <span className="text-xs text-slate-400 shrink-0">Min Stock:</span>
              <input
                type="number" min={0} value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                placeholder="0" autoFocus
                className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-orange-400 focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && void handleBulkMinStock()}
              />
              <span className="text-xs text-slate-500">0 = ไม่แจ้งเตือน</span>
              <button onClick={() => void handleBulkMinStock()} disabled={bulkValue === '' || bulkSaving}
                className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 hover:bg-orange-400">
                {bulkSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? <TableSkeleton cols={9} rows={6} hasCheckbox /> : (<>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </th>
                  <th className="w-10 px-2 py-3" />
                  <th className="px-4 py-3 font-semibold">ชื่อสินค้า</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold">หน่วย</th>
                  <th className="px-4 py-3 text-right font-semibold">คงเหลือ</th>
                  <th className="px-4 py-3 text-right font-semibold text-amber-600">จอง</th>
                  <th className="px-4 py-3 text-right font-semibold text-blue-600">พร้อมขาย</th>
                  <th className="px-4 py-3 text-right font-semibold">ราคา/หน่วย</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11}>
                    <EmptyState icon={<Box size={22} />}
                      title={rows.length === 0 ? 'ยังไม่มีข้อมูลสินค้า' : 'ไม่พบสินค้าที่ตรงกับเงื่อนไข'}
                      description={rows.length === 0 ? 'คลิก "เพิ่มสินค้าใหม่" เพื่อเพิ่มสินค้าหรือบริการรายการแรก' : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'} />
                  </td></tr>
                ) : paginated.map(row => {
                  const committed = committedMap.get(row.id) ?? 0
                  const available = row.stock - committed
                  return (
                    <tr key={row.id} className={`border-t border-slate-100 transition-colors hover:bg-slate-50/50 ${selectedIds.has(row.id) ? 'bg-slate-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)} className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                      </td>
                      <td className="px-2 py-3">
                        <ProductAvatar name={row.name} imageUrl={row.image_url || undefined} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/inventory/products/${row.id}`)} className="text-left">
                          <p className="font-medium text-blue-600 hover:underline">{row.name}</p>
                          {row.description && <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{row.description}</p>}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.sku ? <span className="text-slate-600">{row.sku}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.category ? <span className="text-slate-600">{row.category}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.unit ? <span className="text-slate-600">{row.unit}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      {/* on_hand */}
                      <td className="px-4 py-3 text-right">
                        <span className={stockCls(row.stock, row.min_stock)}>{row.stock.toLocaleString('th-TH')}</span>
                      </td>
                      {/* committed */}
                      <td className="px-4 py-3 text-right">
                        <span className={committed > 0 ? 'font-semibold text-amber-600' : 'text-slate-400'}>
                          {committed.toLocaleString('th-TH')}
                        </span>
                      </td>
                      {/* available */}
                      <td className="px-4 py-3 text-right">
                        <span className={stockCls(available, row.min_stock)}>{available.toLocaleString('th-TH')}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <KebabMenu
                          onEdit={() => openEdit(row)}
                          onDelete={() => void onDelete(row.id)}
                          deleteLabel="ลบสินค้า"
                          extraItems={[
                            { label: 'ปรับจำนวนสต็อกด่วน', onClick: () => setQuickAdjustProduct(row) },
                            { label: 'ดูรายละเอียดสินค้า',   onClick: () => navigate(`/inventory/products/${row.id}`) },
                            { label: 'ดูประวัติสต็อกล่าสุด',  onClick: () => setHistoryProduct(row) },
                          ]}
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

      {/* Modals */}
      {historyProduct && <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />}
      {quickAdjustProduct && (
        <QuickAdjustModal
          product={quickAdjustProduct}
          onClose={() => setQuickAdjustProduct(null)}
          onDone={() => { setQuickAdjustProduct(null); void loadRows() }}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header + image side-by-side */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">{editingId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มข้อมูลสินค้า'}</h2>
              {/* Image upload */}
              <label className="group relative flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-blue-400 hover:bg-blue-50">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <svg className="h-6 w-6 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-1 text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors">รูปสินค้า</span>
                  </>
                )}
                {imagePreview && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-medium text-white">เปลี่ยนรูป</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]; e.target.value = ''
                    if (!f) return
                    setImageFile(f)
                    const reader = new FileReader()
                    reader.onload = () => setImagePreview(reader.result as string)
                    reader.readAsDataURL(f)
                  }} />
              </label>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ข้อมูลทั่วไป</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
              <FormField label="ชื่อสินค้า/บริการ *"><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="SKU (รหัสสินค้า)"><input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="เช่น PRD-001" className={inputCls} /></FormField>
              <FormField label="หมวดหมู่"><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls} /></FormField>
              <FormField label="หน่วย"><input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="เช่น ชิ้น, กก., ลัง" className={inputCls} /></FormField>
              <FormField label="ประเภทภาษี">
                <select value={form.tax_type} onChange={e => setForm(p => ({ ...p, tax_type: e.target.value }))} className={inputCls}>
                  <option value="vat_included">รวม VAT 7%</option>
                  <option value="vat_excluded">แยก VAT 7%</option>
                  <option value="vat_exempt">ยกเว้น VAT</option>
                </select>
              </FormField>
              <div className="md:col-span-2">
                <FormField label="รายละเอียดสินค้า">
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="รายละเอียดเพิ่มเติม..." />
                </FormField>
              </div>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ราคาและสต็อก</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-5">
              <FormField label="ราคาขาย/หน่วย (฿)"><input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) || 0 }))} className={inputCls} /></FormField>
              <FormField label="ราคาต้นทุน (฿)"><input type="number" min={0} step="0.01" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: Number(e.target.value) || 0 }))} className={inputCls} /></FormField>
              <FormField label="จำนวนคงเหลือ (Stock)"><input type="number" min={0} value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) || 0 }))} className={inputCls} /></FormField>
              <FormField label="สต็อกขั้นต่ำ (Min Stock)"><input type="number" min={0} value={form.min_stock} onChange={e => setForm(p => ({ ...p, min_stock: Number(e.target.value) || 0 }))} placeholder="0 = ไม่แจ้งเตือน" className={inputCls} /></FormField>
            </div>

            {form.tax_type && <p className="mb-4 text-xs text-slate-500">ภาษี: <span className="font-medium text-slate-700">{TAX_TYPE_LABEL[form.tax_type]}</span></p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">ยกเลิก</button>
              <button onClick={() => void onSubmit()} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
