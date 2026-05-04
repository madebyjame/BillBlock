import type { DocInfoBlockData } from '../../types/block'
import { DOCUMENT_TYPES } from '../../types/block'
import BlockShell from '../ui/BlockShell'
import InlineEdit from '../ui/InlineEdit'
import ToggleField from '../ui/ToggleField'

interface Props {
  id: string
  data: DocInfoBlockData
  onChange: (d: Partial<DocInfoBlockData>) => void
  onRemove: () => void
}

interface FieldRow {
  key: keyof DocInfoBlockData['visibleFields']
  label: string
  content: React.ReactNode
}

export default function DocInfoBlock({ id, data, onChange, onRemove }: Props) {
  function toggleField(field: keyof DocInfoBlockData['visibleFields']) {
    onChange({ visibleFields: { ...data.visibleFields, [field]: !data.visibleFields[field] } })
  }

  const rows: FieldRow[] = [
    {
      key: 'dueDate',
      label: 'กำหนดชำระ',
      content: (
        <input type="date" value={data.dueDate}
          onChange={e => onChange({ dueDate: e.target.value })}
          className="rounded border-0 bg-transparent text-sm text-slate-700 focus:outline-none" />
      ),
    },
    {
      key: 'salesperson',
      label: 'พนักงานขาย',
      content: <InlineEdit value={data.salesperson} onChange={v => onChange({ salesperson: v })} placeholder="ชื่อพนักงาน" />,
    },
    {
      key: 'paymentTerms',
      label: 'เงื่อนไขการชำระ',
      content: <InlineEdit value={data.paymentTerms} onChange={v => onChange({ paymentTerms: v })} placeholder="เช่น ชำระภายใน 30 วัน" />,
    },
    {
      key: 'projectName',
      label: 'ชื่อโปรเจค',
      content: <InlineEdit value={data.projectName} onChange={v => onChange({ projectName: v })} placeholder="ชื่อโปรเจค" />,
    },
  ]

  return (
    <BlockShell id={id} label="Document Info — ข้อมูลเอกสาร" onRemove={onRemove}>
      <div className="flex gap-5 px-5 py-4">
        {/* ตารางข้อมูลเอกสาร */}
        <div className="flex-1">
          {/* ชื่อเอกสาร */}
          <div className="mb-3">
            <select
              value={data.documentType}
              onChange={e => onChange({ documentType: e.target.value })}
              className="text-xl font-bold text-slate-800 focus:outline-none bg-transparent border-0 cursor-pointer hover:text-blue-700"
            >
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="เลขที่เอกสาร">
                <InlineEdit value={data.documentNumber} onChange={v => onChange({ documentNumber: v })}
                  placeholder="QT-2025-001" className="font-mono font-medium" />
              </InfoRow>
              <InfoRow label="วันที่เอกสาร">
                <input type="date" value={data.documentDate}
                  onChange={e => onChange({ documentDate: e.target.value })}
                  className="rounded border-0 bg-transparent text-sm text-slate-700 focus:outline-none" />
              </InfoRow>
              {rows.map(row =>
                data.visibleFields[row.key] && (
                  <InfoRow key={row.key} label={row.label}>{row.content}</InfoRow>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Field toggles */}
        <div className="flex w-36 flex-shrink-0 flex-col gap-1 border-l border-slate-100 pl-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">แสดง/ซ่อน</p>
          {rows.map(row => (
            <ToggleField key={row.key} label={row.label}
              visible={data.visibleFields[row.key]} onToggle={() => toggleField(row.key)} />
          ))}
        </div>
      </div>
    </BlockShell>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-50">
      <td className="py-1 pr-4 text-xs font-medium text-slate-400 whitespace-nowrap">{label}</td>
      <td className="py-1 text-slate-700">{children}</td>
    </tr>
  )
}
