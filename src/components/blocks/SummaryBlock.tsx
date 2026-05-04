import type { SummaryBlockData, TableBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import ToggleField from '../ui/ToggleField'
import { calcSummary, formatCurrency, numberToThaiText } from '../../utils/calculations'

interface Props {
  id: string
  data: SummaryBlockData
  tableData?: TableBlockData   // รับข้อมูลจาก Table Block เพื่อคำนวณ
  onChange: (d: Partial<SummaryBlockData>) => void
  onRemove: () => void
}

export default function SummaryBlock({ id, data, tableData, onChange, onRemove }: Props) {
  const rows = tableData?.rows ?? []
  const { subtotal, vatAmount, total } = calcSummary(rows, data)

  function toggleField(field: keyof SummaryBlockData['visibleFields']) {
    onChange({ visibleFields: { ...data.visibleFields, [field]: !data.visibleFields[field] } })
  }

  return (
    <BlockShell id={id} label="Summary — สรุปยอด" onRemove={onRemove}>
      <div className="flex gap-5 px-5 py-4">
        <div className="flex-1">
          {/* Thai text */}
          {data.visibleFields.thaiText && (
            <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {numberToThaiText(total)}
            </div>
          )}

          {/* Summary table */}
          <div className="ml-auto w-64 space-y-1.5 text-sm">
            <SummaryRow label="ยอดรวม" value={formatCurrency(subtotal)} />

            {data.visibleFields.discount && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ส่วนลดพิเศษ</span>
                <div className="flex items-center gap-1">
                  <input type="number" value={data.discountAmount} min={0}
                    onChange={e => onChange({ discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-24 rounded border border-slate-200 px-2 py-0.5 text-right text-sm focus:border-blue-400 focus:outline-none" />
                  <span className="text-slate-400">฿</span>
                </div>
              </div>
            )}

            {data.visibleFields.vat && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-500">
                  VAT
                  <input type="number" value={data.vatRate} min={0} max={100}
                    onChange={e => onChange({ vatRate: parseFloat(e.target.value) || 0 })}
                    className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center text-sm focus:border-blue-400 focus:outline-none" />
                  %
                </label>
                <span className="tabular-nums text-slate-600">{formatCurrency(vatAmount)} ฿</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">ยอดรวมสุทธิ</span>
                <span className="text-lg font-bold tabular-nums text-blue-700">{formatCurrency(total)} ฿</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex w-28 flex-shrink-0 flex-col gap-1 border-l border-slate-100 pl-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">แสดง/ซ่อน</p>
          <ToggleField label="จำนวนเป็นคำ" visible={data.visibleFields.thaiText} onToggle={() => toggleField('thaiText')} />
          <ToggleField label="ส่วนลดพิเศษ" visible={data.visibleFields.discount} onToggle={() => toggleField('discount')} />
          <ToggleField label="VAT" visible={data.visibleFields.vat} onToggle={() => toggleField('vat')} />
        </div>
      </div>
    </BlockShell>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums text-slate-700">{value} ฿</span>
    </div>
  )
}
