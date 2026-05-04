import type { InfoBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import EditableField from '../ui/EditableField'

interface InfoBlockProps {
  id: string
  data: InfoBlockData
  onChange: (data: Partial<InfoBlockData>) => void
  onRemove: () => void
}

const DOCUMENT_TYPES = ['ใบเสนอราคา', 'ใบแจ้งหนี้', 'ใบเสร็จรับเงิน', 'ใบวางบิล', 'ใบกำกับภาษี']

export default function InfoBlock({ id, data, onChange, onRemove }: InfoBlockProps) {
  return (
    <BlockShell id={id} label="Info Block — ข้อมูลเอกสาร & ลูกค้า" onRemove={onRemove}>
      {/* 2 คอลัมน์: ข้อมูลเอกสาร (ซ้าย) | ข้อมูลลูกค้า (ขวา) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {/* ─── คอลัมน์ซ้าย: ข้อมูลเอกสาร ─── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ข้อมูลเอกสาร</p>

          {/* Dropdown เลือกประเภทเอกสาร */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-gray-400">ประเภทเอกสาร</label>
            <select
              value={data.documentType}
              onChange={e => onChange({ documentType: e.target.value })}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <EditableField
            label="เลขที่เอกสาร"
            value={data.documentNumber}
            onChange={v => onChange({ documentNumber: v })}
            placeholder="QT-2025-001"
          />
          <EditableField
            label="วันที่เอกสาร"
            value={data.documentDate}
            onChange={v => onChange({ documentDate: v })}
            type="date"
          />
          <EditableField
            label="กำหนดชำระ (ถ้ามี)"
            value={data.dueDate ?? ''}
            onChange={v => onChange({ dueDate: v })}
            type="date"
          />
        </div>

        {/* ─── คอลัมน์ขวา: ข้อมูลลูกค้า ─── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ข้อมูลลูกค้า</p>
          <EditableField
            label="ชื่อลูกค้า / บริษัท"
            value={data.customerName}
            onChange={v => onChange({ customerName: v })}
            placeholder="ชื่อลูกค้า"
          />
          <EditableField
            label="ที่อยู่ลูกค้า"
            value={data.customerAddress}
            onChange={v => onChange({ customerAddress: v })}
            type="textarea"
            placeholder="ที่อยู่ลูกค้า"
          />
          <EditableField
            label="เบอร์โทร"
            value={data.customerPhone ?? ''}
            onChange={v => onChange({ customerPhone: v })}
            placeholder="0x-xxxx-xxxx"
          />
          <EditableField
            label="เลขประจำตัวผู้เสียภาษี"
            value={data.customerTaxId ?? ''}
            onChange={v => onChange({ customerTaxId: v })}
            placeholder="0000000000000"
          />
        </div>
      </div>
    </BlockShell>
  )
}
