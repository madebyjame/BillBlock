import type { FooterBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import InlineEdit from '../ui/InlineEdit'
import ToggleField from '../ui/ToggleField'

interface Props {
  id: string
  data: FooterBlockData
  onChange: (d: Partial<FooterBlockData>) => void
  onRemove: () => void
}

export default function FooterBlock({ id, data, onChange, onRemove }: Props) {
  function toggleField(field: keyof FooterBlockData['visibleFields']) {
    onChange({ visibleFields: { ...data.visibleFields, [field]: !data.visibleFields[field] } })
  }

  return (
    <BlockShell id={id} label="Footer — ลายเซ็น & บัญชี" onRemove={onRemove}>
      <div className="flex gap-5 px-5 py-4">
        <div className="flex-1">
          {/* 3 คอลัมน์: บัญชี | ลายเซ็นลูกค้า | ลายเซ็นผู้อนุมัติ */}
          <div className="grid grid-cols-3 gap-4">
            {/* ─ ข้อมูลธนาคาร */}
            {data.visibleFields.bankInfo && (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">ชำระเงินผ่าน</p>
                <InlineEdit value={data.bankName} onChange={v => onChange({ bankName: v })}
                  placeholder="ธนาคาร" className="text-xs font-medium text-slate-700" />
                <InlineEdit value={data.accountName} onChange={v => onChange({ accountName: v })}
                  placeholder="ชื่อบัญชี" className="text-xs text-slate-500" />
                <InlineEdit value={data.accountNumber} onChange={v => onChange({ accountNumber: v })}
                  placeholder="เลขบัญชี" className="font-mono text-xs text-slate-700" />
              </div>
            )}

            {/* ─ ลายเซ็นลูกค้า */}
            {data.visibleFields.customerSignature && (
              <SignatureBox
                label={data.customerSignerLabel}
                onLabelChange={v => onChange({ customerSignerLabel: v })}
              />
            )}

            {/* ─ ลายเซ็นผู้อนุมัติ */}
            <SignatureBox
              label={data.signerName}
              sublabel={data.signerTitle}
              onLabelChange={v => onChange({ signerName: v })}
              onSublabelChange={v => onChange({ signerTitle: v })}
              imageUrl={data.signatureImageUrl}
              onImageUpload={url => onChange({ signatureImageUrl: url })}
              stampImageUrl={data.visibleFields.stamp ? data.stampImageUrl : undefined}
              onStampUpload={url => onChange({ stampImageUrl: url })}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex w-28 flex-shrink-0 flex-col gap-1 border-l border-slate-100 pl-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">แสดง/ซ่อน</p>
          <ToggleField label="บัญชีธนาคาร" visible={data.visibleFields.bankInfo} onToggle={() => toggleField('bankInfo')} />
          <ToggleField label="ลายเซ็นลูกค้า" visible={data.visibleFields.customerSignature} onToggle={() => toggleField('customerSignature')} />
          <ToggleField label="ตราประทับ" visible={data.visibleFields.stamp} onToggle={() => toggleField('stamp')} />
        </div>
      </div>
    </BlockShell>
  )
}

interface SignatureBoxProps {
  label: string
  sublabel?: string
  onLabelChange: (v: string) => void
  onSublabelChange?: (v: string) => void
  imageUrl?: string
  onImageUpload?: (url: string) => void
  stampImageUrl?: string
  onStampUpload?: (url: string) => void
}

function SignatureBox({ label, sublabel, onLabelChange, onSublabelChange, imageUrl, onImageUpload, stampImageUrl, onStampUpload }: SignatureBoxProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-slate-100 p-3">
      {/* พื้นที่ลายเซ็น */}
      <label className="relative flex h-16 w-full cursor-pointer items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50/50 hover:border-blue-300">
        {imageUrl
          ? <img src={imageUrl} alt="signature" className="h-full object-contain" />
          : <span className="text-[10px] text-slate-300">คลิกอัปโหลดลายเซ็น</span>
        }
        {onImageUpload && (
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f && onImageUpload) onImageUpload(URL.createObjectURL(f)) }} />
        )}
      </label>

      {/* ตราประทับ */}
      {onStampUpload !== undefined && (
        <label className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-200 hover:border-blue-300">
          {stampImageUrl
            ? <img src={stampImageUrl} alt="stamp" className="h-full w-full rounded-full object-contain" />
            : <span className="text-[9px] text-slate-300 text-center leading-tight">ตรา</span>
          }
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onStampUpload(URL.createObjectURL(f)) }} />
        </label>
      )}

      {/* เส้น + ชื่อ */}
      <div className="w-full border-t border-slate-300 pt-1 text-center">
        <InlineEdit value={label} onChange={onLabelChange}
          placeholder="ชื่อผู้ลงนาม" className="text-xs font-medium text-slate-700 text-center" />
        {onSublabelChange && sublabel !== undefined && (
          <InlineEdit value={sublabel} onChange={onSublabelChange}
            placeholder="ตำแหน่ง" className="text-[10px] text-slate-400 text-center" />
        )}
      </div>
    </div>
  )
}
