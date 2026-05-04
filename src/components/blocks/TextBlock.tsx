import type { TextBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import EditableField from '../ui/EditableField'

interface TextBlockProps {
  id: string
  data: TextBlockData
  onChange: (data: Partial<TextBlockData>) => void
  onRemove: () => void
}

export default function TextBlock({ id, data, onChange, onRemove }: TextBlockProps) {
  return (
    <BlockShell id={id} label="Text Block — หมายเหตุ / ข้อความอิสระ" onRemove={onRemove}>
      <div className="flex flex-col gap-2">
        <EditableField
          label="หัวข้อ (ไม่บังคับ)"
          value={data.title ?? ''}
          onChange={v => onChange({ title: v })}
          placeholder="เช่น หมายเหตุ, เงื่อนไขการชำระเงิน"
        />
        <EditableField
          label="ข้อความ"
          value={data.content}
          onChange={v => onChange({ content: v })}
          type="textarea"
          placeholder="ระบุข้อความที่นี่..."
        />
      </div>
    </BlockShell>
  )
}
