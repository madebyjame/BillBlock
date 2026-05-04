import type { DocumentData } from '../types/document'
import { CURRENCIES, THEME_COLORS } from '../types/document'
import type { DocumentAction } from '../store/documentStore'

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
}

export default function RightPanel({ doc, dispatch }: Props) {
  function toggle(path: string) { dispatch({ type: 'TOGGLE_VISIBILITY', path }) }
  function setSetting(data: Partial<DocumentData['settings']>) { dispatch({ type: 'UPDATE_SETTINGS', data }) }

  const v = doc.visibility
  const s = doc.settings

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ตั้งค่าเอกสาร</p>
      </div>

      <div className="flex-1 p-3 space-y-4 text-sm">

        {/* ─── สีหลัก (Theme Color) ─── */}
        <Section title="สีหลักเอกสาร">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {THEME_COLORS.map(c => (
              <button key={c.value} onClick={() => setSetting({ themeColor: c.value })}
                title={c.label}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${s.themeColor === c.value ? 'border-slate-600 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }} />
            ))}
            {/* Custom color */}
            <label className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-500 overflow-hidden" title="เลือกสีเอง">
              <span className="text-[9px] text-slate-400">+</span>
              <input type="color" value={s.themeColor}
                onChange={e => setSetting({ themeColor: e.target.value })}
                className="absolute opacity-0 w-0 h-0" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded" style={{ backgroundColor: s.themeColor }} />
            <span className="text-xs text-slate-400 font-mono">{s.themeColor}</span>
          </div>
        </Section>

        {/* ─── สกุลเงิน ─── */}
        <Section title="สกุลเงิน">
          <select
            value={s.currency}
            onChange={e => {
              const cur = CURRENCIES.find(c => c.code === e.target.value)
              if (cur) setSetting({ currency: cur.code, currencySymbol: cur.symbol })
            }}
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Section>

        {/* ─── VAT Mode ─── */}
        <Section title="การคิด VAT">
          <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setSetting({ vatMode: 'exclusive' })}
              className={`flex-1 py-1.5 font-medium transition-colors ${s.vatMode === 'exclusive' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              style={s.vatMode === 'exclusive' ? { backgroundColor: doc.settings.themeColor } : {}}
            >
              แยก VAT
            </button>
            <button
              onClick={() => setSetting({ vatMode: 'inclusive' })}
              className={`flex-1 py-1.5 font-medium transition-colors ${s.vatMode === 'inclusive' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              style={s.vatMode === 'inclusive' ? { backgroundColor: doc.settings.themeColor } : {}}
            >
              รวม VAT
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {s.vatMode === 'exclusive' ? 'ราคาสินค้ายังไม่รวม VAT (เพิ่มท้าย)' : 'ราคาสินค้ารวม VAT แล้ว (หักออก)'}
          </p>
        </Section>

        {/* ─── Header ─── */}
        <Section title="Header — บริษัท">
          <Toggle label="ที่อยู่"         on={v.header.address} onToggle={() => toggle('header.address')} tc={s.themeColor} />
          <Toggle label="โทรศัพท์"        on={v.header.phone}   onToggle={() => toggle('header.phone')}   tc={s.themeColor} />
          <Toggle label="อีเมล"           on={v.header.email}   onToggle={() => toggle('header.email')}   tc={s.themeColor} />
          <Toggle label="เลขผู้เสียภาษี"  on={v.header.taxId}   onToggle={() => toggle('header.taxId')}   tc={s.themeColor} />
        </Section>

        {/* ─── Doc Meta ─── */}
        <Section title="Document Info">
          <Toggle label="เงื่อนไขเครดิต"  on={v.docMeta.credit}       onToggle={() => toggle('docMeta.credit')}       tc={s.themeColor} />
          <Toggle label="พนักงานขาย"      on={v.docMeta.salesperson}  onToggle={() => toggle('docMeta.salesperson')}  tc={s.themeColor} />
          <Toggle label="ชื่อโปรเจค"      on={v.docMeta.projectName}  onToggle={() => toggle('docMeta.projectName')}  tc={s.themeColor} />
        </Section>

        {/* ─── Customer ─── */}
        <Section title="Customer — ลูกค้า">
          <Toggle label="เลขผู้เสียภาษี"  on={v.customer.taxId}  onToggle={() => toggle('customer.taxId')}  tc={s.themeColor} />
          <Toggle label="สาขา"            on={v.customer.branch} onToggle={() => toggle('customer.branch')} tc={s.themeColor} />
        </Section>

        {/* ─── Table ─── */}
        <Section title="Table — ตาราง">
          <Toggle label="ลำดับ (#)"  on={v.table.no}       onToggle={() => toggle('table.no')}       tc={s.themeColor} />
          <Toggle label="หน่วย"      on={v.table.unit}     onToggle={() => toggle('table.unit')}     tc={s.themeColor} />
          <Toggle label="ส่วนลดแถว" on={v.table.discount} onToggle={() => toggle('table.discount')} tc={s.themeColor} />
        </Section>

        {/* ─── Summary ─── */}
        <Section title="Summary — สรุปยอด">
          <Toggle label="จำนวนเป็นคำอ่าน" on={v.summary.thaiText}        onToggle={() => toggle('summary.thaiText')}        tc={s.themeColor} />
          <Toggle label="ส่วนลดพิเศษ"     on={v.summary.specialDiscount} onToggle={() => toggle('summary.specialDiscount')} tc={s.themeColor} />
          <Toggle label="VAT"             on={v.summary.vat}             onToggle={() => toggle('summary.vat')}             tc={s.themeColor} />
          <Toggle label="หมายเหตุ"         on={v.summary.notes}           onToggle={() => toggle('summary.notes')}           tc={s.themeColor} />
          {v.summary.vat && (
            <div className="flex items-center gap-2 mt-1 pl-1">
              <span className="text-xs text-slate-400">อัตรา VAT</span>
              <input type="number" value={doc.summary.vatRate} min={0} max={100}
                onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { vatRate: parseFloat(e.target.value) || 0 } })}
                className="w-14 rounded border border-slate-200 px-2 py-0.5 text-sm text-center focus:border-blue-400 focus:outline-none" />
              <span className="text-xs text-slate-400">%</span>
            </div>
          )}
        </Section>

        {/* ─── Footer ─── */}
        <Section title="Footer — ลายเซ็น">
          <Toggle label="ลายเซ็นผู้ซื้อ" on={v.footer.buyerSignature} onToggle={() => toggle('footer.buyerSignature')} tc={s.themeColor} />
          <Toggle label="ตราประทับ"      on={v.footer.stamp}          onToggle={() => toggle('footer.stamp')}          tc={s.themeColor} />
          <Toggle label="บัญชีธนาคาร"   on={v.footer.bankInfo}       onToggle={() => toggle('footer.bankInfo')}       tc={s.themeColor} />
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

function Toggle({ label, on, onToggle, tc }: { label: string; on: boolean; onToggle: () => void; tc: string }) {
  return (
    <button onClick={onToggle}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${on ? 'text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
      style={on ? { backgroundColor: tc + '20', color: tc, border: `1px solid ${tc}40` } : {}}
    >
      <span>{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${on ? 'text-white' : 'bg-slate-200 text-slate-400'}`}
        style={on ? { backgroundColor: tc } : {}}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
