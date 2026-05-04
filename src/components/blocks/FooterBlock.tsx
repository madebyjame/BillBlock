import type { FooterBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import EditableField from '../ui/EditableField'

interface FooterBlockProps {
  id: string
  data: FooterBlockData
  onChange: (data: Partial<FooterBlockData>) => void
  onRemove: () => void
}

export default function FooterBlock({ id, data, onChange, onRemove }: FooterBlockProps) {
  return (
    <BlockShell id={id} label="Footer Block — บัญชีธนาคาร & ลายเซ็น" onRemove={onRemove}>
      {/* 2 คอลัมน์: บัญชีธนาคาร (ซ้าย) | ลายเซ็น (ขวา) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {/* ─── คอลัมน์ซ้าย: ข้อมูลธนาคาร ─── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ข้อมูลธนาคาร</p>
          <EditableField
            label="ธนาคาร"
            value={data.bankName ?? ''}
            onChange={v => onChange({ bankName: v })}
            placeholder="เช่น ธนาคารกสิกรไทย"
          />
          <EditableField
            label="ชื่อบัญชี"
            value={data.accountName ?? ''}
            onChange={v => onChange({ accountName: v })}
            placeholder="ชื่อบัญชี"
          />
          <EditableField
            label="เลขบัญชี"
            value={data.accountNumber ?? ''}
            onChange={v => onChange({ accountNumber: v })}
            placeholder="xxx-x-xxxxx-x"
          />
          <EditableField
            label="หมายเหตุ"
            value={data.note ?? ''}
            onChange={v => onChange({ note: v })}
            type="textarea"
            placeholder="หมายเหตุเพิ่มเติม"
          />
        </div>

        {/* ─── คอลัมน์ขวา: ลายเซ็น ─── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">ลายเซ็นผู้มีอำนาจ</p>
          <EditableField
            label="ชื่อผู้ลงนาม"
            value={data.signerName ?? ''}
            onChange={v => onChange({ signerName: v })}
            placeholder="ชื่อ-นามสกุล"
          />
          <EditableField
            label="ตำแหน่ง"
            value={data.signerTitle ?? ''}
            onChange={v => onChange({ signerTitle: v })}
            placeholder="เช่น ผู้จัดการ, กรรมการผู้จัดการ"
          />
          {/* พื้นที่ลายเซ็น */}
          <div className="mt-2 flex flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-200 p-4">
            <div className="h-10 w-full"></div>
            <div className="w-40 border-t border-gray-300 pt-1 text-center text-xs text-gray-400">
              ลายมือชื่อ
            </div>
          </div>
        </div>
      </div>
    </BlockShell>
  )
}
