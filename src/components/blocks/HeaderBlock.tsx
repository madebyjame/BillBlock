import type { HeaderBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import EditableField from '../ui/EditableField'

interface HeaderBlockProps {
  id: string
  data: HeaderBlockData
  onChange: (data: Partial<HeaderBlockData>) => void
  onRemove: () => void
}

export default function HeaderBlock({ id, data, onChange, onRemove }: HeaderBlockProps) {
  return (
    <BlockShell id={id} label="Header Block — ข้อมูลบริษัท" onRemove={onRemove}>
      <div className="flex gap-4">
        {/* ฝั่งซ้าย: โลโก้ */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="logo" className="h-full w-full rounded-lg object-contain" />
            ) : (
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            )}
          </div>
          <label className="cursor-pointer rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200">
            อัปโหลดโลโก้
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const url = URL.createObjectURL(file)
                  onChange({ logoUrl: url })
                }
              }}
            />
          </label>
        </div>

        {/* ฝั่งขวา: ข้อมูลบริษัท */}
        <div className="flex flex-1 flex-col gap-2">
          <EditableField
            label="ชื่อบริษัท / ร้านค้า"
            value={data.companyName}
            onChange={v => onChange({ companyName: v })}
            placeholder="ชื่อบริษัทของคุณ"
          />
          <EditableField
            label="ที่อยู่"
            value={data.address}
            onChange={v => onChange({ address: v })}
            type="textarea"
            placeholder="ที่อยู่บริษัท"
          />
          <div className="grid grid-cols-2 gap-2">
            <EditableField
              label="เบอร์โทร"
              value={data.phone}
              onChange={v => onChange({ phone: v })}
              placeholder="02-xxx-xxxx"
            />
            <EditableField
              label="อีเมล"
              value={data.email}
              onChange={v => onChange({ email: v })}
              placeholder="email@company.com"
            />
          </div>
        </div>
      </div>
    </BlockShell>
  )
}
