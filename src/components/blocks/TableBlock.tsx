import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { TableBlockData, TableRow } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import ToggleField from '../ui/ToggleField'
import { calcRowTotal, formatCurrency } from '../../utils/calculations'
import { generateId } from '../../utils/idGenerator'

interface Props {
  id: string
  data: TableBlockData
  onChange: (d: Partial<TableBlockData>) => void
  onRemove: () => void
}

const col = createColumnHelper<TableRow>()

export default function TableBlock({ id, data, onChange, onRemove }: Props) {
  function updateRow(rowId: string, field: keyof TableRow, value: string | number) {
    onChange({ rows: data.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r) })
  }
  function addRow() {
    onChange({ rows: [...data.rows, { id: generateId(), description: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, discount: 0 }] })
  }
  function removeRow(rowId: string) {
    if (data.rows.length <= 1) return
    onChange({ rows: data.rows.filter(r => r.id !== rowId) })
  }
  function toggleCol(field: keyof TableBlockData['visibleColumns']) {
    onChange({ visibleColumns: { ...data.visibleColumns, [field]: !data.visibleColumns[field] } })
  }

  // สร้าง column definitions แบบ dynamic ตาม visibleColumns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<TableRow, any>[] = [
    col.display({ id: 'no', header: '#',
      cell: ({ row }) => <span className="text-slate-400">{row.index + 1}</span>,
    }),
    col.accessor('description', { header: 'รายการ',
      cell: ({ row }) => (
        <input type="text" value={row.original.description}
          onChange={e => updateRow(row.original.id, 'description', e.target.value)}
          placeholder="ระบุรายการ..."
          className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder-slate-300 focus:outline-none" />
      ),
    }),
    ...(data.visibleColumns.unit ? [col.accessor('unit', { header: 'หน่วย',
      cell: ({ row }: { row: { original: TableRow } }) => (
        <input type="text" value={row.original.unit}
          onChange={e => updateRow(row.original.id, 'unit', e.target.value)}
          className="w-16 border-0 bg-transparent text-center text-sm text-slate-700 focus:outline-none" />
      ),
    })] : []),
    col.accessor('quantity', { header: 'จำนวน',
      cell: ({ row }) => (
        <input type="number" value={row.original.quantity} min={0}
          onChange={e => updateRow(row.original.id, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-20 border-0 bg-transparent text-right text-sm text-slate-700 focus:outline-none" />
      ),
    }),
    col.accessor('unitPrice', { header: 'ราคา/หน่วย',
      cell: ({ row }) => (
        <input type="number" value={row.original.unitPrice} min={0}
          onChange={e => updateRow(row.original.id, 'unitPrice', parseFloat(e.target.value) || 0)}
          className="w-28 border-0 bg-transparent text-right text-sm text-slate-700 focus:outline-none" />
      ),
    }),
    ...(data.visibleColumns.discount ? [col.accessor('discount', { header: 'ส่วนลด%',
      cell: ({ row }: { row: { original: TableRow } }) => (
        <input type="number" value={row.original.discount} min={0} max={100}
          onChange={e => updateRow(row.original.id, 'discount', parseFloat(e.target.value) || 0)}
          className="w-20 border-0 bg-transparent text-right text-sm text-slate-700 focus:outline-none" />
      ),
    })] : []),
    col.display({ id: 'total', header: 'จำนวนเงิน',
      cell: ({ row }) => (
        <span className="block text-right text-sm font-medium tabular-nums text-slate-700">
          {formatCurrency(calcRowTotal(row.original))}
        </span>
      ),
    }),
    col.display({ id: 'actions', header: '',
      cell: ({ row }) => (
        <button onClick={() => removeRow(row.original.id)} disabled={data.rows.length <= 1}
          className="text-slate-200 hover:text-red-400 disabled:opacity-0">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ),
    }),
  ]

  const table = useReactTable({ data: data.rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <BlockShell id={id} label="Table — รายการสินค้า/บริการ" onRemove={onRemove}>
      <div className="flex gap-0">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} className="border-b border-t border-slate-200 bg-slate-50">
                  {hg.headers.map(h => (
                    <th key={h.id}
                      className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 first:pl-5 last:pr-5">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr key={row.id}
                  className={`border-b border-slate-100 transition-colors hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2 first:pl-5 last:pr-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addRow}
            className="mx-5 mt-2 mb-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มรายการ
          </button>
        </div>

        {/* Column toggles */}
        <div className="flex w-28 flex-shrink-0 flex-col gap-1 border-l border-slate-100 p-3">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">คอลัมน์</p>
          <ToggleField label="หน่วย" visible={data.visibleColumns.unit} onToggle={() => toggleCol('unit')} />
          <ToggleField label="ส่วนลด" visible={data.visibleColumns.discount} onToggle={() => toggleCol('discount')} />
        </div>
      </div>
    </BlockShell>
  )
}
