import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Paperclip, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { listProducts, type ProductRow } from '../lib/productApi'
import { recordStockMovement, type MovementType } from '../lib/stockApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string
  product: ProductRow | null
  search: string
  showDropdown: boolean
  qty: number | ''
  cost: number | ''
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVEMENT_META: Record<MovementType, {
  label: string; short: string; desc: string; prefix: string
  activeClass: string
}> = {
  IN:     { label: 'รับเข้า',  short: 'Stock IN',  desc: 'รับจาก Supplier / โอนเข้า / ของแถม', prefix: 'GR',  activeClass: 'border-green-500 bg-green-50 text-green-700'   },
  OUT:    { label: 'เบิกออก', short: 'Stock OUT', desc: 'ของเสีย / สูญหาย / แจก / โอนออก',    prefix: 'GI',  activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
  ADJUST: { label: 'ปรับปรุง', short: 'Adjust',    desc: 'ตรวจนับ / ปรับยอดให้ตรง',             prefix: 'ADJ', activeClass: 'border-blue-500 bg-blue-50 text-blue-700'       },
}

function newLine(): LineItem {
  return { id: crypto.randomUUID(), product: null, search: '', showDropdown: false, qty: '', cost: '' }
}

function genDocNumber(type: MovementType): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `${MOVEMENT_META[type].prefix}-${y}${m}${d}-${rand}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StockAdjustmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<ProductRow[]>([])
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [docNumber, setDocNumber] = useState(() => genDocNumber('IN'))
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<LineItem[]>([newLine()])
  const [attachments, setAttachments] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => {
    void listProducts().then(setProducts).catch(() => toast.error('โหลดสินค้าไม่สำเร็จ'))
  }, [])

  function changeType(t: MovementType) {
    setMovementType(t)
    setDocNumber(genDocNumber(t))
  }

  // ─── Line mutations ───────────────────────────────────────────────────────

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function deleteLine(id: string) {
    setLines(prev => prev.length === 1 ? [newLine()] : prev.filter(l => l.id !== id))
  }

  function selectProduct(lineId: string, p: ProductRow) {
    updateLine(lineId, { product: p, search: p.name, showDropdown: false, cost: p.cost_price || '' })
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  function previewAfter(line: LineItem): number | null {
    if (!line.product || line.qty === '' || Number(line.qty) <= 0) return null
    const qty = Number(line.qty)
    return movementType === 'OUT' ? line.product.stock - qty : line.product.stock + qty
  }

  const totalQty = useMemo(
    () => lines.reduce((s, l) => s + (l.qty !== '' && l.product ? Number(l.qty) : 0), 0),
    [lines],
  )

  const validLines = lines.filter(l => l.product && l.qty !== '' && Number(l.qty) > 0)
  const canSubmit = validLines.length > 0 && note.trim().length > 0

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      for (const line of validLines) {
        await recordStockMovement({
          product_id:         line.product!.id,
          movement_type:      movementType,
          quantity:           Number(line.qty),
          reference_document: reference.trim() || docNumber,
          note:               note.trim(),
        })
      }
      toast.success(`บันทึก ${validLines.length} รายการสำเร็จ — ${meta.label}`)
      navigate('/inventory/products')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const meta = MOVEMENT_META[movementType]
  const showCost = movementType === 'IN'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">

      {/* Page title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับ
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
            <ArrowLeftRight size={17} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-800">เอกสารเคลื่อนไหวสต็อก</h1>
            <p className="text-xs text-slate-400">รับเข้า / เบิกออก / ปรับปรุงสต็อกหลายรายการพร้อมกัน</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Document Header
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        {/* Movement type */}
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">ประเภทการเคลื่อนไหว</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(MOVEMENT_META) as MovementType[]).map(t => {
              const m = MOVEMENT_META[t]
              const active = movementType === t
              return (
                <button key={t} onClick={() => changeType(t)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${active ? m.activeClass : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight opacity-60">{m.short} · {m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2-col fields */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">

          {/* เลขที่เอกสาร — read-only */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">เลขที่เอกสาร</p>
            <div className="flex h-[38px] select-all items-center rounded-lg border border-slate-100 bg-slate-50 px-3 font-mono text-sm text-slate-500">
              {docNumber}
            </div>
          </div>

          {/* วันที่ */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">วันที่ทำรายการ</p>
            <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
          </div>

          {/* เอกสารอ้างอิง */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">
              เอกสารอ้างอิง
              <span className="ml-1 font-normal text-slate-300">(เช่น PO / DO จาก Supplier)</span>
            </p>
            <input value={reference} onChange={e => setReference(e.target.value)}
              placeholder="PO-2026-001"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:border-slate-400 focus:outline-none" />
          </div>

          {/* หมายเหตุ */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500">
              หมายเหตุ / เหตุผล
              <span className="ml-1 text-red-400">*</span>
            </p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="เช่น รับของจาก Supplier ABC, ของเสียจากน้ำท่วม, ตรวจนับประจำปี..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:border-slate-400 focus:outline-none" />
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Line Items
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">รายการสินค้า</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3 text-center font-medium">#</th>
                <th className="min-w-[220px] px-4 py-3 font-medium">สินค้า</th>
                <th className="w-28 px-4 py-3 text-right font-medium">คงเหลือเดิม</th>
                <th className="w-28 px-4 py-3 text-right font-medium">จำนวน</th>
                {showCost && <th className="w-32 px-4 py-3 text-right font-medium">ต้นทุน/หน่วย</th>}
                <th className="w-28 px-4 py-3 text-right font-medium">ยอดหลังปรับ</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lines.map((line, idx) => {
                const after = previewAfter(line)
                const filtered = products.filter(p =>
                  line.search.length > 0 && (
                    p.name.toLowerCase().includes(line.search.toLowerCase()) ||
                    p.sku.toLowerCase().includes(line.search.toLowerCase())
                  )
                )
                return (
                  <tr key={line.id} className="group transition-colors hover:bg-slate-50/70">
                    {/* # */}
                    <td className="px-4 py-2.5 text-center text-xs font-medium text-slate-300">
                      {idx + 1}
                    </td>

                    {/* สินค้า — autocomplete */}
                    <td className="px-4 py-2">
                      <div className="relative">
                        <input
                          value={line.search}
                          onChange={e => updateLine(line.id, { search: e.target.value, showDropdown: true, product: null })}
                          onFocus={() => updateLine(line.id, { showDropdown: true })}
                          onBlur={() => setTimeout(() => updateLine(line.id, { showDropdown: false }), 160)}
                          placeholder="ค้นหาชื่อสินค้า / SKU..."
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-700 placeholder-slate-300 transition-colors focus:border-slate-200 focus:bg-white focus:outline-none group-hover:border-slate-100"
                        />
                        {line.product && (
                          <p className="px-2 text-[11px] text-slate-400">{line.product.sku ? `SKU: ${line.product.sku} · ` : ''}{line.product.unit}</p>
                        )}
                        {line.showDropdown && filtered.length > 0 && (
                          <div className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            {filtered.slice(0, 7).map(p => (
                              <button key={p.id} onMouseDown={() => selectProduct(line.id, p)}
                                className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                                  {p.sku && <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>}
                                </div>
                                <span className="ml-3 shrink-0 text-xs text-slate-400">
                                  {p.stock.toLocaleString('th-TH')} {p.unit}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* คงเหลือเดิม */}
                    <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-300">
                      {line.product ? line.product.stock.toLocaleString('th-TH') : '—'}
                    </td>

                    {/* จำนวน */}
                    <td className="px-4 py-2">
                      <input
                        type="number" min={0} value={line.qty}
                        onChange={e => updateLine(line.id, { qty: e.target.value === '' ? '' : Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-right text-sm text-slate-700 transition-colors focus:border-slate-200 focus:bg-white focus:outline-none group-hover:border-slate-100"
                      />
                    </td>

                    {/* ต้นทุน/หน่วย — IN only */}
                    {showCost && (
                      <td className="px-4 py-2">
                        <input
                          type="number" min={0} step="0.01" value={line.cost}
                          onChange={e => updateLine(line.id, { cost: e.target.value === '' ? '' : Number(e.target.value) })}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-right text-sm text-slate-700 transition-colors focus:border-slate-200 focus:bg-white focus:outline-none group-hover:border-slate-100"
                        />
                      </td>
                    )}

                    {/* ยอดหลังปรับ */}
                    <td className="px-4 py-2.5 text-right">
                      {after === null
                        ? <span className="text-slate-200 text-sm">—</span>
                        : <span className={`text-sm font-bold ${after < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                            {after < 0 ? `ติดลบ (${after})` : after.toLocaleString('th-TH')}
                          </span>
                      }
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteLine(line.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Add row button */}
        <div className="border-t border-dashed border-slate-100 px-4 py-2.5">
          <button onClick={() => setLines(prev => [...prev, newLine()])}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
            <Plus size={13} />
            เพิ่มรายการสินค้า
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Footer & Summary
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        {/* Attachment */}
        <div className="flex-1 min-w-[200px]">
          <p className="mb-2 text-xs font-medium text-slate-500">
            ไฟล์แนบ
            <span className="ml-1 font-normal text-slate-300">(ใบส่งของ / รูปถ่าย)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                <Paperclip size={11} className="shrink-0 text-slate-400" />
                <span className="max-w-[100px] truncate">{f.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-slate-600 transition-colors">
                  <X size={11} />
                </button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-400 hover:text-slate-600">
              <Paperclip size={12} />
              แนบไฟล์
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden"
              onChange={e => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                setAttachments(prev => [...prev, ...files])
              }} />
          </div>
        </div>

        {/* Summary + Actions */}
        <div className="flex flex-col items-end gap-3">
          {/* Summary chips */}
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-center">
              <p className="text-[11px] text-slate-400">รายการ</p>
              <p className="text-lg font-bold text-slate-700">{lines.filter(l => l.product).length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-[11px] text-slate-400">จำนวนรวม</p>
              <p className="text-lg font-bold text-slate-700">{totalQty.toLocaleString('th-TH')}</p>
            </div>
            {showCost && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-[11px] text-slate-400">มูลค่ารับเข้า</p>
                  <p className="text-lg font-bold text-slate-700">
                    ฿{lines.reduce((s, l) => {
                      if (!l.product || l.qty === '' || l.cost === '') return s
                      return s + Number(l.qty) * Number(l.cost)
                    }, 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
              ยกเลิก
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || saving}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: themeColor }}>
              {saving ? 'กำลังบันทึก...' : `บันทึก${meta.label} (${validLines.length})`}
            </button>
          </div>
          {!note.trim() && validLines.length > 0 && (
            <p className="text-[11px] text-red-400">* กรุณาระบุหมายเหตุก่อนบันทึก</p>
          )}
        </div>
      </div>

    </div>
  )
}
