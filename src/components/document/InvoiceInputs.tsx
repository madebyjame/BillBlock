import { useRef, useState } from 'react'
import type { LineItem, CatalogItem, DocumentData } from '../../types/document'
import type { DocumentAction } from '../../store/documentStore'
import type { CustomerRow } from '../../lib/customerApi'
import type { ProductRow } from '../../lib/productApi'
import { formatNumber } from '../../utils/calculations'

// ─── Inline editable field (text / textarea) ───
export function F({ value, onChange, className = '', multiline = false, pdfMode }: {
  value: string; onChange: (v: string) => void
  className?: string; multiline?: boolean; pdfMode: boolean
}) {
  if (pdfMode) {
    return multiline
      ? <p className={`whitespace-pre-wrap ${className}`}>{value}</p>
      : <span className={className}>{value}</span>
  }
  const base = `rounded px-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none ${className}`
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={`w-full resize-none border-0 bg-transparent ${base}`} />
    : <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`border-0 bg-transparent w-full ${base}`} />
}

// ─── Autocomplete Description Input ───
export function DescriptionInput({ item, dispatch, catalog, products }: {
  item: LineItem
  dispatch: React.Dispatch<DocumentAction>
  catalog: CatalogItem[]
  products: ProductRow[]
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  type MatchOption = { key: string; label: string; unit: string; unitPrice: number; discountType: 'percent' | 'amount'; product_id?: string }

  const matches: MatchOption[] = item.description.length > 0
    ? [
        ...catalog
          .filter((c) => c.description.toLowerCase().includes(item.description.toLowerCase()) && c.description !== item.description)
          .map((c) => ({ key: `catalog:${c.description}`, label: c.description, unit: c.unit, unitPrice: c.unitPrice, discountType: c.discountType as 'percent' | 'amount' })),
        ...products
          .filter((p) => p.name.toLowerCase().includes(item.description.toLowerCase()) && p.name !== item.description)
          .map((p) => ({ key: `product:${p.id}`, label: p.name, unit: p.unit, unitPrice: p.price, discountType: 'percent' as const, product_id: p.id })),
      ]
    : []

  function fill(match: MatchOption) {
    dispatch({ type: 'FILL_ITEM', id: item.id, data: { description: match.label, unit: match.unit, unitPrice: match.unitPrice, discountType: match.discountType, product_id: match.product_id } })
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1">
        <svg className="h-3 w-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={item.description}
          onChange={e => { dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'description', value: e.target.value }); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="ชื่อสินค้า/บริการ"
          className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none" />
      </div>
      <input type="text" value={item.detail}
        onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'detail', value: e.target.value })}
        placeholder="รายละเอียดเพิ่มเติม"
        className="w-full border-0 bg-transparent text-xs text-slate-400 placeholder-slate-200 focus:outline-none pl-4" />
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-20 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            ผลการค้นหา
          </div>
          {matches.slice(0, 8).map((match) => (
            <button key={match.key} onMouseDown={() => fill(match)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{match.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {match.unit} <span className="text-slate-300">|</span> {formatNumber(match.unitPrice)} ฿ <span className="text-slate-300">|</span> {match.discountType === 'percent' ? '% ส่วนลด' : '฿ ส่วนลด'}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-blue-400 shrink-0 bg-blue-50 rounded px-1.5 py-0.5">กรอก</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Customer Lookup Input ───
export function CustomerLookupInput({
  pdfMode,
  customer,
  customers,
  onChange,
  onQuickAdd,
}: {
  pdfMode: boolean
  customer: DocumentData['customer']
  customers: CustomerRow[]
  onChange: (data: Partial<DocumentData['customer']>) => void
  onQuickAdd?: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const typedName = customer.name.trim()
  const matches = typedName
    ? customers.filter((row) => row.name.toLowerCase().includes(typedName.toLowerCase()) && row.name !== customer.name).slice(0, 8)
    : []
  const showQuickAdd = !!onQuickAdd && typedName.length > 0

  function applyCustomer(row: CustomerRow) {
    onChange({
      name: row.name,
      address: row.address || customer.address,
      taxId: row.tax_id || customer.taxId,
    })
    setOpen(false)
  }

  if (pdfMode) {
    return <span className="font-semibold text-slate-800">{customer.name}</span>
  }

  const dropdownVisible = open && (matches.length > 0 || showQuickAdd)

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <svg className="h-3 w-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={customer.name}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onChange={(event) => {
            onChange({ name: event.target.value })
            setOpen(true)
          }}
          placeholder="ค้นหาเพื่อเลือกอัตโนมัติ"
          className="w-full rounded border-0 bg-transparent px-0.5 font-semibold text-slate-800 placeholder-slate-300 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      {dropdownVisible && (
        <div className="absolute top-full left-0 z-20 mt-1 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          {matches.map((row) => (
            <button
              key={row.id}
              onMouseDown={() => applyCustomer(row)}
              className="flex w-full items-start justify-between border-b border-slate-50 px-3 py-2 text-left hover:bg-blue-50 last:border-0"
            >
              <div>
                <p className="text-sm text-slate-800">{row.name}</p>
                <p className="text-xs text-slate-400">{row.tax_id || '-'} · {row.phone || '-'}</p>
              </div>
              <span className="ml-2 text-[10px] text-slate-300">เลือก</span>
            </button>
          ))}
          {showQuickAdd && (
            <>
              {matches.length > 0 && <div className="border-t border-slate-100" />}
              <button
                onMouseDown={(e) => { e.preventDefault(); setOpen(false); onQuickAdd!(typedName) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มลูกค้าใหม่ &ldquo;{typedName}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Discount Input (amount/percent toggle) ───
export function DiscountInput({ value, discountType, sym, onValue, onType }: {
  value: number
  discountType: 'percent' | 'amount'
  sym: string
  onValue: (v: number) => void
  onType: (t: 'percent' | 'amount') => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <input type="number" value={value} min={0}
        onChange={e => onValue(parseFloat(e.target.value) || 0)}
        className="w-20 border-b border-slate-200 bg-transparent text-right text-sm focus:border-blue-400 focus:outline-none" />
      <button onClick={() => onType(discountType === 'percent' ? 'amount' : 'percent')}
        className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-slate-100 text-slate-500 hover:bg-slate-200 w-8 text-center"
        title="สลับระหว่าง % และ ฿">
        {discountType === 'percent' ? '%' : sym}
      </button>
    </div>
  )
}
