import { useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { DocumentData, BlockType } from '../types/document'
import { CURRENCIES, THEME_COLORS, BLOCK_CATALOG } from '../types/document'
import type { DocumentAction } from '../store/documentStore'
import { normalizeDocumentDraft } from '../utils/documentDraft'

const SINGLE_INSTANCE_TYPES = new Set<string>(['notes', 'signature', 'bankInfo'])

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  notes: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  ),
  signature: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.829 1.172H7v-2a4 4 0 011.172-2.828z" />
    </svg>
  ),
  bankInfo: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  customText: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  divider: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M4 12h16" />
    </svg>
  ),
}

type TabId = 'content' | 'layout' | 'design'

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
}

export default function RightPanel({ doc, dispatch }: Props) {
  const importRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<TabId>('content')

  function toggle(path: string) { dispatch({ type: 'TOGGLE_VISIBILITY', path }) }
  function setSetting(data: Partial<DocumentData['settings']>) { dispatch({ type: 'UPDATE_SETTINGS', data }) }

  const v = doc?.visibility || ({} as DocumentData['visibility'])
  const s = doc?.settings || ({} as DocumentData['settings'])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'layout',  label: 'Layout' },
    { id: 'design',  label: 'Design' },
  ]

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-slate-800 border-b-2'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            style={activeTab === tab.id ? { borderColor: s.themeColor } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
        {/* ═══ CONTENT TAB ═══ */}
        {activeTab === 'content' && (
          <>
            {/* Header */}
            <Section title="ส่วนหัว — บริษัท">
              <Toggle label="ที่อยู่"         on={v.header.address} onToggle={() => toggle('header.address')} tc={s.themeColor} />
              <Toggle label="โทรศัพท์"        on={v.header.phone}   onToggle={() => toggle('header.phone')}   tc={s.themeColor} />
              <Toggle label="อีเมล"           on={v.header.email}   onToggle={() => toggle('header.email')}   tc={s.themeColor} />
              <Toggle label="เลขผู้เสียภาษี"  on={v.header.taxId}   onToggle={() => toggle('header.taxId')}   tc={s.themeColor} />
            </Section>

            {/* Doc Meta */}
            <Section title="ข้อมูลเอกสาร">
              <Toggle label="เงื่อนไขเครดิต" on={v.docMeta.credit}       onToggle={() => toggle('docMeta.credit')}       tc={s.themeColor} />
              <Toggle label="พนักงานขาย"     on={v.docMeta.salesperson}  onToggle={() => toggle('docMeta.salesperson')}  tc={s.themeColor} />
              <Toggle label="ชื่อโปรเจค"     on={v.docMeta.projectName}  onToggle={() => toggle('docMeta.projectName')}  tc={s.themeColor} />
            </Section>

            {/* Customer */}
            <Section title="ลูกค้า">
              <Toggle label="เลขผู้เสียภาษี" on={v.customer.taxId}  onToggle={() => toggle('customer.taxId')}  tc={s.themeColor} />
              <Toggle label="สาขา"           on={v.customer.branch} onToggle={() => toggle('customer.branch')} tc={s.themeColor} />
            </Section>

            {/* Table */}
            <Section title="ตาราง">
              <Toggle label="ลำดับ (#)"   on={v.table.no}       onToggle={() => toggle('table.no')}       tc={s.themeColor} />
              <Toggle label="หน่วย"       on={v.table.unit}     onToggle={() => toggle('table.unit')}     tc={s.themeColor} />
              <Toggle label="ส่วนลดแถว"  on={v.table.discount} onToggle={() => toggle('table.discount')} tc={s.themeColor} />
            </Section>

            {/* VAT / Summary */}
            <Section title="ภาษี & สรุปยอด">
              <Toggle label="VAT 7%"           on={v.summary.vat}             onToggle={() => toggle('summary.vat')}             tc={s.themeColor} />
              {v.summary.vat && (
                <div className="flex items-center gap-2 mt-1 pl-1">
                  <span className="text-xs text-slate-400">อัตรา</span>
                  <input type="number" value={doc.summary.vatRate} min={0} max={100}
                    onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { vatRate: parseFloat(e.target.value) || 0 } })}
                    className="w-14 rounded border border-slate-200 px-2 py-0.5 text-sm text-center focus:border-blue-400 focus:outline-none" />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              )}
              <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs mt-1">
                <button
                  onClick={() => setSetting({ vatMode: 'exclusive' })}
                  className={`flex-1 py-1.5 font-medium transition-colors ${s.vatMode === 'exclusive' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  style={s.vatMode === 'exclusive' ? { backgroundColor: s.themeColor } : {}}
                >แยก VAT</button>
                <button
                  onClick={() => setSetting({ vatMode: 'inclusive' })}
                  className={`flex-1 py-1.5 font-medium transition-colors ${s.vatMode === 'inclusive' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  style={s.vatMode === 'inclusive' ? { backgroundColor: s.themeColor } : {}}
                >รวม VAT</button>
              </div>
              <Toggle label="จำนวนเป็นคำอ่าน" on={v.summary.thaiText}        onToggle={() => toggle('summary.thaiText')}        tc={s.themeColor} />
              <Toggle label="ส่วนลดพิเศษ"     on={v.summary.specialDiscount} onToggle={() => toggle('summary.specialDiscount')} tc={s.themeColor} />
            </Section>
          </>
        )}

        {/* ═══ LAYOUT TAB ═══ */}
        {activeTab === 'layout' && (
          <>
            <Section title="เพิ่ม Block">
              <p className="text-[10px] text-slate-400 leading-snug mb-2">ลากไปวางในพื้นที่เอกสาร หรือคลิกเพื่อเพิ่ม</p>
              <div className="space-y-1.5">
                {BLOCK_CATALOG.map(cat => {
                  const disabled = SINGLE_INSTANCE_TYPES.has(cat.type) && doc.blocks.some(b => b.type === cat.type)
                  return (
                    <PaletteCard key={cat.type} type={cat.type as BlockType} label={cat.label}
                      desc={cat.desc} disabled={disabled} tc={s.themeColor} />
                  )
                })}
              </div>
            </Section>

            <Section title="ส่วนท้าย — ลายเซ็น">
              <Toggle label="ลายเซ็นผู้ซื้อ" on={v.footer.buyerSignature} onToggle={() => toggle('footer.buyerSignature')} tc={s.themeColor} />
              <Toggle label="ตราประทับ"      on={v.footer.stamp}          onToggle={() => toggle('footer.stamp')}          tc={s.themeColor} />
            </Section>
          </>
        )}

        {/* ═══ DESIGN TAB ═══ */}
        {activeTab === 'design' && (
          <>
            {/* Theme Color */}
            <Section title="สีหลักเอกสาร">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {THEME_COLORS.map(c => (
                  <button key={c.value} onClick={() => setSetting({ themeColor: c.value })}
                    title={c.label}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${s.themeColor === c.value ? 'border-slate-600 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }} />
                ))}
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

            {/* Currency */}
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

            {/* Logo & Signature hint */}
            <Section title="โลโก้ & ลายเซ็น">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>คลิกกล่องโลโก้ในเอกสาร เพื่ออัปโหลดรูป</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>คลิกช่องลายเซ็น เพื่ออัปโหลดลายเซ็นและตราประทับ</span>
                </div>
              </div>
            </Section>

            {/* Backup */}
            <Section title="สำรองข้อมูล">
              <p className="text-[10px] text-slate-400 leading-snug mb-2">
                ส่งออก / นำเข้า JSON เพื่อย้ายข้อมูลหรือสำรองไว้
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    const safe = doc.docMeta.number.replace(/[^\w\-ก-๙]+/g, '_').replace(/^_|_$/g, '') || 'draft'
                    a.href = url
                    a.download = `billblock-${safe}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="w-full rounded-md border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ส่งออก JSON
                </button>
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  className="w-full rounded-md px-2 py-2 text-xs font-medium text-white"
                  style={{ backgroundColor: s.themeColor }}
                >
                  นำเข้า JSON
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      try {
                        const parsed = JSON.parse(reader.result as string) as Partial<DocumentData>
                        dispatch({ type: 'LOAD_DOCUMENT', doc: normalizeDocumentDraft(parsed) })
                      } catch {
                        alert('ไฟล์ JSON ไม่ถูกต้องหรือเสียหาย')
                      }
                    }
                    reader.onerror = () => alert('อ่านไฟล์ไม่สำเร็จ')
                    reader.readAsText(file, 'UTF-8')
                  }}
                />
              </div>
            </Section>
          </>
        )}
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

function PaletteCard({ type, label, desc, disabled, tc }: {
  type: BlockType; label: string; desc: string; disabled: boolean; tc: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : { ...listeners, ...attributes })}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs select-none transition-all duration-150
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-sm'}
        ${isDragging ? 'opacity-0' : ''}
      `}
      style={disabled
        ? { border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }
        : { border: `1px solid ${tc}35`, backgroundColor: `${tc}0d` }
      }
    >
      <span style={disabled ? { color: '#94a3b8' } : { color: tc }} className="shrink-0">
        {BLOCK_ICONS[type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={disabled ? { color: '#94a3b8' } : { color: tc }}>{label}</p>
        <p className="text-[9px] text-slate-400 truncate">{desc}</p>
      </div>
      {disabled
        ? <span className="text-[9px] font-bold text-slate-300 shrink-0">✓</span>
        : <svg className="h-3 w-3 text-slate-300 shrink-0" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
          </svg>
      }
    </div>
  )
}

function Toggle({ label, on, onToggle, tc }: { label: string; on: boolean; onToggle: () => void; tc: string }) {
  return (
    <button onClick={onToggle}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${on ? '' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
      style={on ? { backgroundColor: tc + '18', color: tc, border: `1px solid ${tc}35` } : {}}
    >
      <span>{label}</span>
      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
        style={on ? { backgroundColor: tc, color: '#fff' } : { backgroundColor: '#e2e8f0', color: '#94a3b8' }}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
