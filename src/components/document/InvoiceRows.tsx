import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { LineItem, CatalogItem, DocumentData } from '../../types/document'
import type { DocumentAction } from '../../store/documentStore'
import type { ProductRow } from '../../lib/productApi'
import { calcItemTotal, formatNumber } from '../../utils/calculations'
import { DescriptionInput } from './InvoiceInputs'
import { GripIcon, TrashIcon } from './DocumentIcons'

// ─── Sortable row (edit mode with DnD) ───
export function SortableRow({ item, idx, doc, dispatch, catalog, products, v }: {
  item: LineItem
  idx: number
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
  catalog: CatalogItem[]
  products: ProductRow[]
  v: DocumentData['visibility']
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`border-b border-slate-100 group/row ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
    >
      <td className="px-1 py-2 w-6">
        <button className="cursor-grab touch-none text-slate-200 hover:text-slate-400 active:cursor-grabbing opacity-0 group-hover/row:opacity-100"
          {...attributes} {...listeners} title="ลากเพื่อเรียง">
          <GripIcon />
        </button>
      </td>

      {v.table.no && <td className="px-2 py-2 text-center text-slate-400 text-xs align-top">{idx + 1}</td>}

      <td className="px-2 py-2 align-top">
        <DescriptionInput item={item} dispatch={dispatch} catalog={catalog} products={products} />
      </td>

      <td className="px-2 py-2 align-top">
        <input type="number" value={item.quantity} min={0}
          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'quantity', value: parseFloat(e.target.value) || 0 })}
          className="w-full border-0 bg-transparent text-right text-sm focus:outline-none" />
      </td>

      {v.table.unit && (
        <td className="px-2 py-2 align-top">
          <input type="text" value={item.unit}
            onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unit', value: e.target.value })}
            className="w-full border-0 bg-transparent text-center text-sm focus:outline-none" />
        </td>
      )}

      <td className="px-2 py-2 align-top">
        <input type="number" value={item.unitPrice} min={0}
          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unitPrice', value: parseFloat(e.target.value) || 0 })}
          className="w-full border-0 bg-transparent text-right text-sm focus:outline-none" />
      </td>

      {v.table.discount && (
        <td className="px-2 py-2 align-top">
          <div className="flex items-center justify-end gap-1">
            <input type="number" value={item.discount} min={0}
              onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'discount', value: parseFloat(e.target.value) || 0 })}
              className="w-16 border-0 bg-transparent text-right text-sm focus:outline-none" />
            <button
              onClick={() => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'discountType', value: item.discountType === 'percent' ? 'amount' : 'percent' })}
              className="text-[10px] font-bold rounded px-1 py-0.5 bg-slate-100 text-slate-500 hover:bg-slate-200 w-7 text-center"
              title="สลับระหว่าง % และ ฿">
              {item.discountType === 'percent' ? '%' : '฿'}
            </button>
          </div>
        </td>
      )}

      <td className="px-2 py-2 text-right tabular-nums font-medium text-slate-700 align-top">
        {formatNumber(calcItemTotal(item))}
      </td>

      <td className="px-1 py-2 align-top">
        <button onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
          disabled={doc.items.length <= 1}
          title="ลบรายการนี้"
          className="opacity-0 group-hover/row:opacity-100 text-slate-300 hover:text-red-400 disabled:opacity-0 transition-opacity">
          <TrashIcon />
        </button>
      </td>
    </tr>
  )
}

// ─── Static row (PDF mode, no DnD) ───
export function StaticRow({ item, idx, v }: { item: LineItem; idx: number; v: DocumentData['visibility'] }) {
  return (
    <tr className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
      {v.table.no && <td className="px-3 py-2 text-center text-slate-400 align-top">{idx + 1}</td>}
      <td className="px-3 py-2 align-top">
        <div className="text-slate-800">{item.description}</div>
        {item.detail && <div className="text-slate-400 text-xs">{item.detail}</div>}
      </td>
      <td className="px-3 py-2 text-right align-top">{item.quantity.toLocaleString()}</td>
      {v.table.unit && <td className="px-3 py-2 text-center align-top">{item.unit}</td>}
      <td className="px-3 py-2 text-right align-top tabular-nums">{formatNumber(item.unitPrice)}</td>
      {v.table.discount && <td className="px-3 py-2 text-right align-top tabular-nums">
        {item.discount > 0 ? `${item.discount}${item.discountType === 'percent' ? '%' : '฿'}` : '-'}
      </td>}
      <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-700 align-top">
        {formatNumber(calcItemTotal(item))}
      </td>
    </tr>
  )
}

// ─── Helper table rows ───
export function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-50">
      <td className="py-1 pr-3 text-slate-400 text-xs font-medium whitespace-nowrap w-20">{label}</td>
      <td className="py-1 text-slate-700">{children}</td>
    </tr>
  )
}

export function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <tr>
      <td className={`py-0.5 pr-2 text-right whitespace-nowrap ${muted ? 'text-xs text-slate-400' : 'text-slate-500'}`}>{label}</td>
      <td className={`py-0.5 text-right tabular-nums w-36 whitespace-nowrap ${muted ? 'text-slate-400 text-xs' : 'text-slate-700'}`}>{value}</td>
    </tr>
  )
}
