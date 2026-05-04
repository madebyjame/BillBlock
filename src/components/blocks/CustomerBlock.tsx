import type { CustomerBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import InlineEdit from '../ui/InlineEdit'
import ToggleField from '../ui/ToggleField'

interface Props {
  id: string
  data: CustomerBlockData
  onChange: (d: Partial<CustomerBlockData>) => void
  onRemove: () => void
}

export default function CustomerBlock({ id, data, onChange, onRemove }: Props) {
  function toggleField(field: keyof CustomerBlockData['visibleFields']) {
    onChange({ visibleFields: { ...data.visibleFields, [field]: !data.visibleFields[field] } })
  }

  return (
    <BlockShell id={id} label="Customer — ข้อมูลลูกค้า" onRemove={onRemove}>
      <div className="flex gap-5 px-5 py-4">
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">ลูกค้า / ผู้รับเอกสาร</p>
          <InlineEdit value={data.customerName} onChange={v => onChange({ customerName: v })}
            placeholder="ชื่อลูกค้า / บริษัท" className="mb-1 text-sm font-semibold text-slate-800" />
          <InlineEdit value={data.address} onChange={v => onChange({ address: v })}
            placeholder="ที่อยู่" multiline className="text-xs text-slate-500" />
          {data.visibleFields.taxId && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span className="font-medium text-slate-400">เลขภาษี</span>
              <InlineEdit value={data.taxId} onChange={v => onChange({ taxId: v })} placeholder="0000000000000" />
            </div>
          )}
          {data.visibleFields.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="font-medium text-slate-400">โทร</span>
              <InlineEdit value={data.phone} onChange={v => onChange({ phone: v })} placeholder="0x-xxxx-xxxx" />
            </div>
          )}
        </div>

        <div className="flex w-28 flex-shrink-0 flex-col gap-1 border-l border-slate-100 pl-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">แสดง/ซ่อน</p>
          <ToggleField label="เลขภาษี" visible={data.visibleFields.taxId} onToggle={() => toggleField('taxId')} />
          <ToggleField label="โทรศัพท์" visible={data.visibleFields.phone} onToggle={() => toggleField('phone')} />
        </div>
      </div>
    </BlockShell>
  )
}
