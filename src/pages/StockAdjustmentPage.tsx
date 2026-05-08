import { useEffect, useState } from 'react'
import { ArrowLeftRight, Search } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { listProducts, type ProductRow } from '../lib/productApi'
import { recordStockMovement, type MovementType } from '../lib/stockApi'

const MOVEMENT_TYPES: { value: MovementType; label: string; desc: string; color: string }[] = [
  { value: 'IN',     label: 'รับเข้า (Stock IN)',     desc: 'รับสินค้าจาก Supplier / ของแถม / โอนเข้า', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'OUT',    label: 'ปรับออก (Stock OUT)',     desc: 'ของเสีย / สูญหาย / แจก / โอนออก',         color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'ADJUST', label: 'ปรับปรุง (Adjust)',       desc: 'ตรวจนับสินค้า / ปรับยอดให้ตรง',           color: 'border-blue-400 bg-blue-50 text-blue-700' },
]

export default function StockAdjustmentPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => {
    void (async () => {
      setLoadingProducts(true)
      try { setProducts(await listProducts()) }
      catch { toast.error('โหลดรายการสินค้าไม่สำเร็จ') }
      finally { setLoadingProducts(false) }
    })()
  }, [])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  function selectProduct(p: ProductRow) {
    setSelectedProduct(p)
    setProductSearch(p.name)
    setShowDropdown(false)
  }

  function previewBalance(): number | null {
    if (!selectedProduct || quantity === '' || quantity <= 0) return null
    const qty = Number(quantity)
    if (movementType === 'OUT') return selectedProduct.stock - qty
    return selectedProduct.stock + qty
  }

  const preview = previewBalance()
  const canSubmit = selectedProduct && quantity !== '' && Number(quantity) > 0 && note.trim()

  async function handleSubmit() {
    if (!canSubmit) return
    const qty = Number(quantity)
    if (movementType === 'OUT' && selectedProduct && qty > selectedProduct.stock) {
      toast.error(`สต็อกไม่เพียงพอ (คงเหลือ ${selectedProduct.stock})`)
      return
    }
    setSaving(true)
    try {
      await recordStockMovement({
        product_id:         selectedProduct!.id,
        movement_type:      movementType,
        quantity:           qty,
        reference_document: reference.trim(),
        note:               note.trim(),
      })
      toast.success(`${MOVEMENT_TYPES.find(t => t.value === movementType)?.label} — ${selectedProduct!.name} จำนวน ${qty} ${selectedProduct!.unit || 'ชิ้น'} สำเร็จ`)
      setSelectedProduct(null)
      setProductSearch('')
      setQuantity('')
      setNote('')
      setReference('')
      // Refresh product list to reflect new stock
      setProducts(await listProducts())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ArrowLeftRight size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">รับเข้า / ปรับปรุงสต็อก</h1>
          <p className="text-sm text-slate-400">บันทึกการเคลื่อนไหวสต็อกแบบ Manual</p>
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        {/* Movement Type */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">ประเภทการเคลื่อนไหว *</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MOVEMENT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setMovementType(t.value)}
                className={[
                  'rounded-lg border-2 p-3 text-left transition-all',
                  movementType === t.value ? t.color : 'border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <p className="text-xs font-semibold">{t.label}</p>
                <p className="mt-0.5 text-[11px] opacity-70 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Product Search */}
        <FormField label="สินค้า *">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null) }}
                onFocus={() => setShowDropdown(true)}
                placeholder={loadingProducts ? 'กำลังโหลด...' : 'ค้นหาชื่อสินค้า หรือ SKU'}
                className="flex-1 border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {showDropdown && productSearch && filteredProducts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredProducts.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    onMouseDown={() => selectProduct(p)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-700">{p.name}</p>
                      {p.sku && <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>}
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-slate-500">คงเหลือ {p.stock} {p.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedProduct && (
            <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              สต็อกปัจจุบัน: <span className="font-semibold text-slate-800">{selectedProduct.stock} {selectedProduct.unit || 'ชิ้น'}</span>
              {selectedProduct.min_stock > 0 && (
                <span className="ml-2 text-slate-400">(ขั้นต่ำ {selectedProduct.min_stock})</span>
              )}
            </div>
          )}
        </FormField>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="จำนวน *">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className={inputCls}
            />
          </FormField>
          <FormField label="ยอดหลังปรับ (Preview)">
            <div className={[
              'flex h-[38px] items-center rounded-lg border px-3 text-sm font-semibold',
              preview === null ? 'border-slate-200 text-slate-400' :
              preview < 0 ? 'border-red-300 bg-red-50 text-red-600' :
              'border-green-300 bg-green-50 text-green-700',
            ].join(' ')}>
              {preview === null ? '—' : preview < 0 ? `ติดลบ (${preview})` : preview.toLocaleString('th-TH')}
            </div>
          </FormField>
        </div>

        {/* Reference */}
        <FormField label="เลขอ้างอิงเอกสาร (ถ้ามี)">
          <input
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="เช่น PO-2026-001, REC-2026-001"
            className={inputCls}
          />
        </FormField>

        {/* Note (required) */}
        <FormField label="หมายเหตุ / เหตุผล *">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="ระบุเหตุผล เช่น รับของจาก Supplier, ของเสีย, ตรวจนับสินค้าประจำปี..."
            className={`${inputCls} resize-none`}
          />
          {!note.trim() && <p className="mt-1 text-[11px] text-red-500">* หมายเหตุบังคับกรอก</p>}
        </FormField>

        <button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || saving}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเคลื่อนไหวสต็อก'}
        </button>
      </div>
    </div>
  )
}
