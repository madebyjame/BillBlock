import type { HeaderBlockData } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import InlineEdit from '../ui/InlineEdit'
import ToggleField from '../ui/ToggleField'

interface Props {
  id: string
  data: HeaderBlockData
  onChange: (d: Partial<HeaderBlockData>) => void
  onRemove: () => void
}

export default function HeaderBlock({ id, data, onChange, onRemove }: Props) {
  function toggleField(field: keyof HeaderBlockData['visibleFields']) {
    onChange({ visibleFields: { ...data.visibleFields, [field]: !data.visibleFields[field] } })
  }

  return (
    <BlockShell id={id} label="Header — ข้อมูลบริษัท" onRemove={onRemove}>
      <div className="flex gap-5 px-5 py-4">
        {/* Logo */}
        <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
          <label className="group/logo relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-blue-300">
            {data.logoUrl
              ? <img src={data.logoUrl} alt="logo" className="h-full w-full object-contain p-1" />
              : <LogoPlaceholder />
            }
            <div className="absolute inset-0 hidden items-center justify-center rounded-lg bg-blue-600/10 group-hover/logo:flex">
              <span className="text-[10px] font-medium text-blue-600">เปลี่ยน</span>
            </div>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) onChange({ logoUrl: URL.createObjectURL(f) })
              }} />
          </label>
          <span className="text-[10px] text-slate-300">โลโก้</span>
        </div>

        {/* Company info */}
        <div className="flex-1">
          <InlineEdit
            value={data.companyName}
            onChange={v => onChange({ companyName: v })}
            placeholder="ชื่อบริษัท"
            className="mb-1 text-base font-semibold text-slate-800"
            inputClassName="text-base font-semibold"
          />
          {data.visibleFields.address && (
            <InlineEdit value={data.address} onChange={v => onChange({ address: v })}
              placeholder="ที่อยู่บริษัท" multiline className="text-xs text-slate-500" />
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
            {data.visibleFields.phone && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-400">โทร</span>
                <InlineEdit value={data.phone} onChange={v => onChange({ phone: v })} placeholder="02-xxx-xxxx" />
              </span>
            )}
            {data.visibleFields.email && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-400">อีเมล</span>
                <InlineEdit value={data.email} onChange={v => onChange({ email: v })} placeholder="email@co.th" />
              </span>
            )}
            {data.visibleFields.taxId && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-400">เลขภาษี</span>
                <InlineEdit value={data.taxId} onChange={v => onChange({ taxId: v })} placeholder="0000000000000" />
              </span>
            )}
          </div>
        </div>

        {/* Field toggles */}
        <div className="flex w-28 flex-shrink-0 flex-col gap-1 border-l border-slate-100 pl-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">แสดง/ซ่อน</p>
          {(Object.keys(data.visibleFields) as Array<keyof HeaderBlockData['visibleFields']>).map(f => (
            <ToggleField key={f} label={fieldLabel(f)} visible={data.visibleFields[f]} onToggle={() => toggleField(f)} />
          ))}
        </div>
      </div>
    </BlockShell>
  )
}

function fieldLabel(f: keyof HeaderBlockData['visibleFields']): string {
  return { address: 'ที่อยู่', phone: 'โทรศัพท์', email: 'อีเมล', taxId: 'เลขภาษี' }[f]
}

function LogoPlaceholder() {
  return (
    <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
