import type { DocumentData } from '../types/document'
import type { DocumentAction } from '../store/documentStore'

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
}

export default function RightPanel({ doc, dispatch }: Props) {
  function toggle(path: string) {
    dispatch({ type: 'TOGGLE_VISIBILITY', path })
  }

  const v = doc.visibility

  return (
    <aside className="flex h-full w-52 flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ตั้งค่าการแสดงผล</p>
      </div>

      <div className="flex-1 p-3 space-y-4">

        {/* ─── Header ─── */}
        <Section title="Header — บริษัท">
          <Toggle label="ที่อยู่"        on={v.header.address}    onToggle={() => toggle('header.address')} />
          <Toggle label="โทรศัพท์"       on={v.header.phone}      onToggle={() => toggle('header.phone')} />
          <Toggle label="อีเมล"          on={v.header.email}      onToggle={() => toggle('header.email')} />
          <Toggle label="เลขผู้เสียภาษี" on={v.header.taxId}      onToggle={() => toggle('header.taxId')} />
        </Section>

        {/* ─── Document Meta ─── */}
        <Section title="Document Info">
          <Toggle label="เงื่อนไขเครดิต" on={v.docMeta.credit}      onToggle={() => toggle('docMeta.credit')} />
          <Toggle label="พนักงานขาย"    on={v.docMeta.salesperson} onToggle={() => toggle('docMeta.salesperson')} />
          <Toggle label="ชื่อโปรเจค"    on={v.docMeta.projectName} onToggle={() => toggle('docMeta.projectName')} />
        </Section>

        {/* ─── Customer ─── */}
        <Section title="Customer — ลูกค้า">
          <Toggle label="เลขผู้เสียภาษี" on={v.customer.taxId}  onToggle={() => toggle('customer.taxId')} />
          <Toggle label="สาขา"           on={v.customer.branch} onToggle={() => toggle('customer.branch')} />
        </Section>

        {/* ─── Table ─── */}
        <Section title="Table — ตาราง">
          <Toggle label="ลำดับ (#)"  on={v.table.no}       onToggle={() => toggle('table.no')} />
          <Toggle label="หน่วย"      on={v.table.unit}     onToggle={() => toggle('table.unit')} />
          <Toggle label="ส่วนลด %"   on={v.table.discount} onToggle={() => toggle('table.discount')} />
        </Section>

        {/* ─── Summary ─── */}
        <Section title="Summary — สรุปยอด">
          <Toggle label="จำนวนเป็นคำอ่าน" on={v.summary.thaiText}        onToggle={() => toggle('summary.thaiText')} />
          <Toggle label="ส่วนลดพิเศษ"     on={v.summary.specialDiscount} onToggle={() => toggle('summary.specialDiscount')} />
          <Toggle label="VAT"             on={v.summary.vat}             onToggle={() => toggle('summary.vat')} />
          <Toggle label="หมายเหตุ"         on={v.summary.notes}           onToggle={() => toggle('summary.notes')} />
        </Section>

        {/* ─── Footer ─── */}
        <Section title="Footer — ลายเซ็น">
          <Toggle label="ลายเซ็นผู้ซื้อ" on={v.footer.buyerSignature} onToggle={() => toggle('footer.buyerSignature')} />
          <Toggle label="ตราประทับ"      on={v.footer.stamp}          onToggle={() => toggle('footer.stamp')} />
          <Toggle label="บัญชีธนาคาร"   on={v.footer.bankInfo}       onToggle={() => toggle('footer.bankInfo')} />
        </Section>

        {/* ─── VAT Rate ─── */}
        <Section title="อัตรา VAT">
          <div className="flex items-center gap-2 px-1">
            <input
              type="number"
              value={doc.summary.vatRate}
              min={0}
              max={100}
              onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { vatRate: parseFloat(e.target.value) || 0 } })}
              className="w-16 rounded border border-slate-200 px-2 py-1 text-sm text-center focus:border-blue-400 focus:outline-none"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </Section>

      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
        on ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${on ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
