import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { TableBlockData, TableRow } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import { calcTotal, formatCurrency } from '../../utils/calculations'
import { generateId } from '../../utils/idGenerator'

interface TableBlockProps {
  id: string
  data: TableBlockData
  onChange: (data: Partial<TableBlockData>) => void
  onRemove: () => void
}

const columnHelper = createColumnHelper<TableRow>()

export default function TableBlock({ id, data, onChange, onRemove }: TableBlockProps) {
  const { subtotal, vatAmount, total } = calcTotal(data)

  // อัปเดต row เดียว
  function updateRow(rowId: string, field: keyof TableRow, value: string | number) {
    const updated = data.rows.map(r =>
      r.id === rowId ? { ...r, [field]: value } : r
    )
    onChange({ rows: updated })
  }

  // เพิ่ม row ใหม่
  function addRow() {
    const newRow: TableRow = {
      id: generateId(),
      description: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
    }
    onChange({ rows: [...data.rows, newRow] })
  }

  // ลบ row
  function removeRow(rowId: string) {
    onChange({ rows: data.rows.filter(r => r.id !== rowId) })
  }

  // column definition สำหรับ TanStack Table
  const columns = [
    columnHelper.accessor('description', {
      header: 'รายการ',
      cell: ({ row }) => (
        <input
          type="text"
          value={row.original.description}
          onChange={e => updateRow(row.original.id, 'description', e.target.value)}
          placeholder="ชื่อสินค้า/บริการ"
          className="w-full border-0 bg-transparent text-sm focus:outline-none"
        />
      ),
    }),
    columnHelper.accessor('quantity', {
      header: 'จำนวน',
      cell: ({ row }) => (
        <input
          type="number"
          value={row.original.quantity}
          onChange={e => updateRow(row.original.id, 'quantity', parseFloat(e.target.value) || 0)}
          min={0}
          className="w-20 border-0 bg-transparent text-right text-sm focus:outline-none"
        />
      ),
    }),
    columnHelper.accessor('unit', {
      header: 'หน่วย',
      cell: ({ row }) => (
        <input
          type="text"
          value={row.original.unit}
          onChange={e => updateRow(row.original.id, 'unit', e.target.value)}
          className="w-16 border-0 bg-transparent text-center text-sm focus:outline-none"
        />
      ),
    }),
    columnHelper.accessor('unitPrice', {
      header: 'ราคา/หน่วย',
      cell: ({ row }) => (
        <input
          type="number"
          value={row.original.unitPrice}
          onChange={e => updateRow(row.original.id, 'unitPrice', parseFloat(e.target.value) || 0)}
          min={0}
          className="w-28 border-0 bg-transparent text-right text-sm focus:outline-none"
        />
      ),
    }),
    columnHelper.display({
      id: 'total',
      header: 'รวม',
      cell: ({ row }) => (
        <span className="block text-right text-sm tabular-nums">
          {formatCurrency(row.original.quantity * row.original.unitPrice)}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => removeRow(row.original.id)}
          disabled={data.rows.length <= 1}
          className="text-gray-300 hover:text-red-400 disabled:opacity-30"
          title="ลบแถวนี้"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      ),
    }),
  ]

  const table = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // ไม่ใช้ getRowId เพราะจัดการ id ใน state เอง
  })

  return (
    <BlockShell id={id} label="Table Block — รายการสินค้า/บริการ" onRemove={onRemove}>
      {/* ตารางรายการ */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-500"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="border-b border-gray-100 px-3 py-1.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ปุ่มเพิ่มแถว */}
      <button
        onClick={addRow}
        className="mt-2 flex items-center gap-1 rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
        </svg>
        เพิ่มรายการ
      </button>

      {/* ─── สรุปยอด ─── */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ยอดรวม</span>
            <span className="tabular-nums">{formatCurrency(subtotal)} บาท</span>
          </div>

          {/* ส่วนลด */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">ส่วนลด</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={data.discountAmount}
                onChange={e => onChange({ discountAmount: parseFloat(e.target.value) || 0 })}
                min={0}
                className="w-24 rounded border border-gray-200 px-2 py-0.5 text-right text-sm focus:border-blue-400 focus:outline-none"
              />
              <span className="text-gray-400">บาท</span>
            </div>
          </div>

          {/* VAT toggle */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-1.5 text-gray-500">
              <input
                type="checkbox"
                checked={data.includeVat}
                onChange={e => onChange({ includeVat: e.target.checked })}
                className="rounded"
              />
              VAT
              <input
                type="number"
                value={data.vatRate}
                onChange={e => onChange({ vatRate: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-sm focus:border-blue-400 focus:outline-none"
              />
              %
            </label>
            <span className="tabular-nums text-gray-500">
              {data.includeVat ? formatCurrency(vatAmount) : '-'} บาท
            </span>
          </div>

          <div className="mt-1 border-t border-gray-200 pt-1">
            <div className="flex justify-between font-semibold">
              <span>ยอดรวมสุทธิ</span>
              <span className="tabular-nums text-blue-600">{formatCurrency(total)} บาท</span>
            </div>
          </div>
        </div>
      </div>
    </BlockShell>
  )
}
