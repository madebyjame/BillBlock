import { createContext, useContext, useRef, useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import type { DocumentData, LineItem, CatalogItem } from '../types/document'
import { DOCUMENT_TYPES } from '../types/document'
import type { DocumentAction } from '../store/documentStore'
import {
  calcItemTotal, calcDocSummary, formatNumber, formatDate, numberToThaiText,
} from '../utils/calculations'
import { readImageFileAsDataUrl } from '../utils/fileToDataUrl'

export const PdfModeContext = createContext(false)

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
  docRef: React.RefObject<HTMLDivElement | null>
  catalog: CatalogItem[]
}

export default function InvoiceDocument({ doc, dispatch, docRef, catalog }: Props) {
  const pdfMode = useContext(PdfModeContext)
  const v = doc.visibility
  const tc = doc.settings.themeColor   // theme color
  const sym = doc.settings.currencySymbol

  const { subtotal, specialDiscountAmt, vatAmount, preTaxAmount, total } = calcDocSummary(doc)

  // ─── Row DnD sensors ───
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleRowDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = doc.items.findIndex(i => i.id === active.id)
    const newIdx = doc.items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(doc.items, oldIdx, newIdx)
    dispatch({ type: 'REORDER_ITEMS', ids: reordered.map(i => i.id) })
  }

  return (
    <div
      ref={docRef}
      className="mx-auto w-full bg-white"
      style={{ maxWidth: '794px', minHeight: '1123px', fontFamily: "'Sarabun', sans-serif", fontSize: '14px' }}
    >
      <div className="p-10">

        {/* ═══ SECTION 1: Header 2-col ═══ */}
        <div className="grid grid-cols-2 gap-8 mb-5">

          {/* ── ซ้าย: โลโก้ + บริษัท + ลูกค้า ── */}
          <div>
            {/* Company */}
            <div className="flex items-start gap-3 mb-4">
              <label className={`flex-shrink-0 flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 ${pdfMode ? 'pointer-events-none' : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50'}`}>
                {doc.company.logoUrl
                  ? <img src={doc.company.logoUrl} alt="logo" className="h-full w-full object-contain p-0.5" />
                  : <LogoPlaceholder />}
                {!pdfMode && <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (!f) return
                    void readImageFileAsDataUrl(f).then(
                      dataUrl => dispatch({ type: 'UPDATE_COMPANY', data: { logoUrl: dataUrl } }),
                      err => alert(err instanceof Error ? err.message : String(err)),
                    )
                  }} />}
              </label>
              <div className="flex-1 text-sm leading-relaxed">
                <F pdfMode={pdfMode} value={doc.company.name} className="font-bold text-slate-800 text-base"
                  onChange={v => dispatch({ type: 'UPDATE_COMPANY', data: { name: v } })} />
                {v.header.address && <F pdfMode={pdfMode} multiline value={doc.company.address} className="text-slate-500"
                  onChange={v => dispatch({ type: 'UPDATE_COMPANY', data: { address: v } })} />}
                {v.header.taxId && <F pdfMode={pdfMode} value={`เลขประจำตัวผู้เสียภาษี ${doc.company.taxId}`} className="text-slate-500"
                  onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { taxId: val.replace('เลขประจำตัวผู้เสียภาษี ', '') } })} />}
                {v.header.phone && <F pdfMode={pdfMode} value={`เบอร์โทร ${doc.company.phone}`} className="text-slate-500"
                  onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { phone: val.replace('เบอร์โทร ', '') } })} />}
                {v.header.email && <F pdfMode={pdfMode} value={doc.company.email} className="text-slate-500"
                  onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { email: val } })} />}
              </div>
            </div>

            {/* Customer */}
            <div className="text-sm leading-relaxed">
              <p className="font-semibold mb-1" style={{ color: tc }}>ลูกค้า</p>
              <F pdfMode={pdfMode} value={doc.customer.name} className="font-semibold text-slate-800"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { name: val } })} />
              <F pdfMode={pdfMode} multiline value={doc.customer.address} className="text-slate-500"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { address: val } })} />
              {v.customer.taxId && <F pdfMode={pdfMode} value={`เลขประจำตัวผู้เสียภาษี ${doc.customer.taxId}`} className="text-slate-500"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { taxId: val.replace('เลขประจำตัวผู้เสียภาษี ', '') } })} />}
              {v.customer.branch && <F pdfMode={pdfMode} value={doc.customer.branch} className="text-slate-500"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { branch: val } })} />}
            </div>
          </div>

          {/* ── ขวา: ชื่อเอกสาร + meta ── */}
          <div className="relative">
            {/* Triangle */}
            <div className="absolute top-0 right-0 w-0 h-0"
              style={{ borderStyle: 'solid', borderWidth: '0 70px 70px 0', borderColor: `transparent ${tc} transparent transparent` }} />

            {/* Document type */}
            {pdfMode
              ? <h1 className="text-3xl font-bold text-slate-800 mb-3 pr-16">{doc.docMeta.documentType}</h1>
              : <select value={doc.docMeta.documentType}
                  onChange={e => dispatch({ type: 'UPDATE_DOC_META', data: { documentType: e.target.value } })}
                  className="text-3xl font-bold text-slate-800 mb-3 pr-16 bg-transparent border-0 cursor-pointer focus:outline-none hover:opacity-70 w-full">
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            }

            <div className="border-t border-slate-200 pt-2">
              <table className="w-full text-sm">
                <tbody>
                  <MetaRow label="เลขที่">
                    <F pdfMode={pdfMode} value={doc.docMeta.number} className="font-mono text-slate-700"
                      onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { number: v } })} />
                  </MetaRow>
                  <MetaRow label="วันที่">
                    {pdfMode
                      ? <span className="text-slate-700">{formatDate(doc.docMeta.date)}</span>
                      : <input type="date" value={doc.docMeta.date} className="border-0 bg-transparent text-sm text-slate-700 focus:outline-none"
                          onChange={e => dispatch({ type: 'UPDATE_DOC_META', data: { date: e.target.value } })} />}
                  </MetaRow>
                  {v.docMeta.credit && <MetaRow label="เครดิต">
                    <F pdfMode={pdfMode} value={doc.docMeta.credit} className="text-slate-700"
                      onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { credit: v } })} />
                  </MetaRow>}
                  {v.docMeta.salesperson && <MetaRow label="ผู้ขาย">
                    <F pdfMode={pdfMode} value={doc.docMeta.salesperson} className="text-slate-700"
                      onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { salesperson: v } })} />
                  </MetaRow>}
                  {v.docMeta.projectName && <MetaRow label="ชื่องาน">
                    <F pdfMode={pdfMode} value={doc.docMeta.projectName} className="text-slate-700"
                      onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { projectName: v } })} />
                  </MetaRow>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: Items Table ═══ */}
        <div className="border-t border-b border-slate-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: tc }} className="text-white">
                {!pdfMode && <th className="w-6 px-1 py-2" />}  {/* drag handle col */}
                {v.table.no && <th className="px-3 py-2 text-center font-semibold w-8">#</th>}
                <th className="px-3 py-2 text-left font-semibold">รายละเอียด</th>
                <th className="px-3 py-2 text-right font-semibold w-20">จำนวน</th>
                {v.table.unit && <th className="px-3 py-2 text-center font-semibold w-16">หน่วย</th>}
                <th className="px-3 py-2 text-right font-semibold w-28">ราคา/หน่วย</th>
                {v.table.discount && <th className="px-3 py-2 text-right font-semibold w-28">ส่วนลด</th>}
                <th className="px-3 py-2 text-right font-semibold w-28">มูลค่า</th>
                {!pdfMode && <th className="w-8" />}  {/* delete col */}
              </tr>
            </thead>

            {pdfMode ? (
              <tbody>
                {doc.items.map((item, idx) => (
                  <StaticRow key={item.id} item={item} idx={idx} v={v} />
                ))}
              </tbody>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragEnd={handleRowDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={doc.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {doc.items.map((item, idx) => (
                      <SortableRow key={item.id} item={item} idx={idx} doc={doc}
                        dispatch={dispatch} catalog={catalog} v={v} />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            )}
          </table>

          {!pdfMode && (
            <button onClick={() => dispatch({ type: 'ADD_ITEM' })}
              className="mx-3 my-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มรายการ
            </button>
          )}
        </div>

        {/* ═══ SECTION 3: Thai text + Notes | Summary ═══ */}
        <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-200">
          {/* ── ซ้าย ── */}
          <div className="flex flex-col gap-3 text-sm">
            {v.summary.thaiText && (
              <p className="text-slate-500 italic">({numberToThaiText(total)})</p>
            )}
            {v.summary.notes && (
              <div>
                <p className="font-semibold mb-0.5" style={{ color: tc }}>หมายเหตุ</p>
                {pdfMode
                  ? <p className="text-slate-600 whitespace-pre-wrap">{doc.notes}</p>
                  : <textarea value={doc.notes} rows={3}
                      onChange={e => dispatch({ type: 'UPDATE_NOTES', notes: e.target.value })}
                      placeholder="ระบุหมายเหตุ / เงื่อนไขเพิ่มเติม..."
                      className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-300 resize-none focus:outline-none" />
                }
              </div>
            )}
          </div>

          {/* ── ขวา: Summary ── */}
          <div>
            <table className="w-full text-sm">
              <tbody>
                <SummaryRow label="รวมเป็นเงิน" value={`${formatNumber(subtotal)} ${sym}`} />
                {v.summary.specialDiscount && (
                  <tr>
                    <td className="py-1 pr-2 text-right text-slate-500 text-xs whitespace-nowrap">
                      ส่วนลดพิเศษ{doc.summary.specialDiscountType === 'percent' ? ` ${doc.summary.specialDiscount}%` : ''}
                    </td>
                    <td className="py-1 text-right text-slate-700 tabular-nums w-36">
                      {pdfMode
                        ? `${formatNumber(specialDiscountAmt)} ${sym}`
                        : <DiscountInput
                            value={doc.summary.specialDiscount}
                            discountType={doc.summary.specialDiscountType}
                            sym={sym}
                            onValue={v => dispatch({ type: 'UPDATE_SUMMARY', data: { specialDiscount: v } })}
                            onType={t => dispatch({ type: 'UPDATE_SUMMARY', data: { specialDiscountType: t } })}
                          />
                      }
                    </td>
                  </tr>
                )}
                {v.summary.vat && (
                  <>
                    {doc.settings.vatMode === 'inclusive' && (
                      <SummaryRow label={`ราคาก่อน VAT`} value={`${formatNumber(preTaxAmount)} ${sym}`} muted />
                    )}
                    <tr>
                      <td className="py-1 pr-2 text-right text-slate-500 whitespace-nowrap">
                        {pdfMode
                          ? `ภาษีมูลค่าเพิ่ม ${doc.summary.vatRate}%`
                          : <span className="flex items-center justify-end gap-1">
                              ภาษีมูลค่าเพิ่ม
                              <input type="number" value={doc.summary.vatRate} min={0} max={100}
                                onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { vatRate: parseFloat(e.target.value) || 0 } })}
                                className="w-9 border-b border-slate-200 bg-transparent text-center focus:border-blue-400 focus:outline-none" />
                              %
                            </span>
                        }
                      </td>
                      <td className="py-1 text-right tabular-nums w-36 text-slate-700">
                        {formatNumber(vatAmount)} {sym}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="border-t border-slate-300">
                  <td className="pt-2 pr-2 text-right font-bold text-slate-800 whitespace-nowrap">จำนวนเงินรวมทั้งสิ้น</td>
                  <td className="pt-2 text-right font-bold tabular-nums w-36 text-base whitespace-nowrap" style={{ color: tc }}>
                    {formatNumber(total)} {sym}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ SECTION 4: Signatures ═══ */}
        <div className={`grid gap-8 mt-8 ${v.footer.buyerSignature ? 'grid-cols-2' : 'grid-cols-1 max-w-xs ml-auto'}`}>
          {v.footer.buyerSignature && (
            <SignatureBox pdfMode={pdfMode} label={doc.footer.buyerLabel} title="ผู้สั่งซื้อสินค้า"
              onLabelChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { buyerLabel: v } })} />
          )}
          <SignatureBox pdfMode={pdfMode}
            label={doc.footer.sellerLabel} title={doc.footer.approverName}
            onLabelChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { sellerLabel: v } })}
            onTitleChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { approverName: v } })}
            signatureUrl={doc.footer.signatureUrl}
            stampUrl={v.footer.stamp ? doc.footer.stampUrl : undefined}
            signatureDate={doc.footer.signatureDate}
            showStamp={v.footer.stamp}
            onSignatureUpload={url => dispatch({ type: 'UPDATE_FOOTER', data: { signatureUrl: url } })}
            onStampUpload={url => dispatch({ type: 'UPDATE_FOOTER', data: { stampUrl: url } })}
            onDateChange={d => dispatch({ type: 'UPDATE_FOOTER', data: { signatureDate: d } })}
          />
        </div>

        {/* Bank info */}
        {v.footer.bankInfo && (
          <div className="mt-6 rounded border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">ชำระเงินผ่าน</p>
            <F pdfMode={pdfMode} value={doc.footer.bankName} className="inline"
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { bankName: v } })} />
            {' · '}
            <F pdfMode={pdfMode} value={doc.footer.accountName} className="inline"
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { accountName: v } })} />
            {' · '}
            <F pdfMode={pdfMode} value={doc.footer.accountNumber} className="inline font-mono"
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { accountNumber: v } })} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// SortableRow — แถวที่ลากได้ + ปุ่มลบ + autocomplete
// ─────────────────────────────────────────
function SortableRow({ item, idx, doc, dispatch, catalog, v }: {
  item: LineItem
  idx: number
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
  catalog: CatalogItem[]
  v: DocumentData['visibility']
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`border-b border-slate-100 group/row ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
    >
      {/* Drag handle */}
      <td className="px-1 py-2 w-6">
        <button className="cursor-grab touch-none text-slate-200 hover:text-slate-400 active:cursor-grabbing opacity-0 group-hover/row:opacity-100"
          {...attributes} {...listeners} title="ลากเพื่อเรียง">
          <GripIcon />
        </button>
      </td>

      {v.table.no && <td className="px-2 py-2 text-center text-slate-400 text-xs align-top">{idx + 1}</td>}

      {/* Description + autocomplete */}
      <td className="px-2 py-2 align-top">
        <DescriptionInput item={item} dispatch={dispatch} catalog={catalog} />
      </td>

      <td className="px-2 py-2 align-top">
        <input type="number" value={item.quantity} min={0}
          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'quantity', value: parseFloat(e.target.value) || 0 })}
          className="w-full border-0 bg-transparent text-right text-sm focus:outline-none" />
      </td>

      {v.table.unit && (
        <td className="px-2 py-2 align-top">
          <input type="text" value={item.unit}
            onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unit', value: e.target.value })}
            className="w-full border-0 bg-transparent text-center text-sm focus:outline-none" />
        </td>
      )}

      <td className="px-2 py-2 align-top">
        <input type="number" value={item.unitPrice} min={0}
          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unitPrice', value: parseFloat(e.target.value) || 0 })}
          className="w-full border-0 bg-transparent text-right text-sm focus:outline-none" />
      </td>

      {v.table.discount && (
        <td className="px-2 py-2 align-top">
          <div className="flex items-center justify-end gap-1">
            <input type="number" value={item.discount} min={0}
              onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'discount', value: parseFloat(e.target.value) || 0 })}
              className="w-16 border-0 bg-transparent text-right text-sm focus:outline-none" />
            <button
              onClick={() => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'discountType', value: item.discountType === 'percent' ? 'amount' : 'percent' })}
              className="text-[10px] font-bold rounded px-1 py-0.5 bg-slate-100 text-slate-500 hover:bg-slate-200 w-7 text-center"
              title="สลับระหว่าง % และ ฿">
              {item.discountType === 'percent' ? '%' : '฿'}
            </button>
          </div>
        </td>
      )}

      <td className="px-2 py-2 text-right tabular-nums font-medium text-slate-700 align-top">
        {formatNumber(calcItemTotal(item))}
      </td>

      {/* Delete */}
      <td className="px-1 py-2 align-top">
        <button onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
          disabled={doc.items.length <= 1}
          title="ลบรายการนี้"
          className="opacity-0 group-hover/row:opacity-100 text-slate-300 hover:text-red-400 disabled:opacity-0 transition-opacity">
          <TrashIcon />
        </button>
      </td>
    </tr>
  )
}

// แถว PDF mode (ไม่มี DnD)
function StaticRow({ item, idx, v }: { item: LineItem; idx: number; v: DocumentData['visibility'] }) {
  return (
    <tr className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
      {v.table.no && <td className="px-3 py-2 text-center text-slate-400 align-top">{idx + 1}</td>}
      <td className="px-3 py-2 align-top">
        <div className="text-slate-800">{item.description}</div>
        {item.detail && <div className="text-slate-400 text-xs">{item.detail}</div>}
      </td>
      <td className="px-3 py-2 text-right align-top">{item.quantity.toLocaleString()}</td>
      {v.table.unit && <td className="px-3 py-2 text-center align-top">{item.unit}</td>}
      <td className="px-3 py-2 text-right align-top tabular-nums">{formatNumber(item.unitPrice)}</td>
      {v.table.discount && <td className="px-3 py-2 text-right align-top tabular-nums">
        {item.discount > 0 ? `${item.discount}${item.discountType === 'percent' ? '%' : '฿'}` : '-'}
      </td>}
      <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-700 align-top">
        {formatNumber(calcItemTotal(item))}
      </td>
    </tr>
  )
}

// ─── Autocomplete Description Input ───
function DescriptionInput({ item, dispatch, catalog }: {
  item: LineItem
  dispatch: React.Dispatch<DocumentAction>
  catalog: CatalogItem[]
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const matches = item.description.length > 0
    ? catalog.filter(c => c.description.toLowerCase().includes(item.description.toLowerCase()) && c.description !== item.description)
    : []

  function fill(c: CatalogItem) {
    dispatch({ type: 'FILL_ITEM', id: item.id, data: { description: c.description, unit: c.unit, unitPrice: c.unitPrice, discountType: c.discountType } })
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <input type="text" value={item.description}
        onChange={e => { dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'description', value: e.target.value }); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="ชื่อสินค้า/บริการ"
        className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none" />
      <input type="text" value={item.detail}
        onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'detail', value: e.target.value })}
        placeholder="รายละเอียดเพิ่มเติม"
        className="w-full border-0 bg-transparent text-xs text-slate-400 placeholder-slate-200 focus:outline-none" />
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-20 w-72 rounded-md border border-slate-200 bg-white shadow-lg">
          {matches.slice(0, 8).map(c => (
            <button key={c.description} onMouseDown={() => fill(c)}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm text-slate-800">{c.description}</p>
                <p className="text-xs text-slate-400">{c.unit} · {formatNumber(c.unitPrice)} ฿</p>
              </div>
              <span className="text-[10px] text-slate-300 ml-2">กรอก</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Discount Input (amount/percent toggle) ───
function DiscountInput({ value, discountType, sym, onValue, onType }: {
  value: number
  discountType: 'percent' | 'amount'
  sym: string
  onValue: (v: number) => void
  onType: (t: 'percent' | 'amount') => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <input type="number" value={value} min={0}
        onChange={e => onValue(parseFloat(e.target.value) || 0)}
        className="w-20 border-b border-slate-200 bg-transparent text-right text-sm focus:border-blue-400 focus:outline-none" />
      <button onClick={() => onType(discountType === 'percent' ? 'amount' : 'percent')}
        className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-slate-100 text-slate-500 hover:bg-slate-200 w-8 text-center"
        title="สลับระหว่าง % และ ฿">
        {discountType === 'percent' ? '%' : sym}
      </button>
    </div>
  )
}

// ─── Signature Box ───
function SignatureBox({ pdfMode, label, title, onLabelChange, onTitleChange, signatureUrl, stampUrl, signatureDate, showStamp, onSignatureUpload, onStampUpload, onDateChange }: {
  pdfMode: boolean; label: string; title: string
  onLabelChange: (v: string) => void; onTitleChange?: (v: string) => void
  signatureUrl?: string; stampUrl?: string; signatureDate?: string
  showStamp?: boolean
  onSignatureUpload?: (url: string) => void; onStampUpload?: (url: string) => void
  onDateChange?: (d: string) => void
}) {
  return (
    <div className="flex flex-col items-center text-sm">
      {pdfMode ? <p className="text-slate-600 mb-3">{label}</p>
        : <F pdfMode={pdfMode} value={label} className="text-slate-600 mb-3 text-center" onChange={onLabelChange} />}

      {/* Signature area */}
      <div className="relative w-full flex justify-center items-end mb-2" style={{ height: '56px' }}>
        {onSignatureUpload && (
          <label className={`flex h-14 items-center justify-center ${pdfMode ? '' : 'cursor-pointer'}`}>
            {signatureUrl
              ? <img src={signatureUrl} alt="sig" className="h-14 object-contain" />
              : !pdfMode && <span className="text-[10px] text-slate-200 hover:text-slate-400 border border-dashed border-slate-200 rounded px-3 py-2">+ ลายเซ็น</span>
            }
            {!pdfMode && <input type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f || !onSignatureUpload) return
                void readImageFileAsDataUrl(f).then(onSignatureUpload, err => alert(err instanceof Error ? err.message : String(err)))
              }} />}
          </label>
        )}
        {showStamp && onStampUpload && (
          <label className={`absolute right-0 bottom-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-200 overflow-hidden ${pdfMode ? '' : 'cursor-pointer hover:border-blue-300'}`}>
            {stampUrl
              ? <img src={stampUrl} alt="stamp" className="h-full w-full object-contain" />
              : !pdfMode && <span className="text-[9px] text-slate-300 text-center">ตรา</span>
            }
            {!pdfMode && <input type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                void readImageFileAsDataUrl(f).then(onStampUpload, err => alert(err instanceof Error ? err.message : String(err)))
              }} />}
          </label>
        )}
      </div>

      {onDateChange && (
        pdfMode
          ? <p className="text-xs text-slate-400 mb-1">{signatureDate ? formatDate(signatureDate) : ''}</p>
          : <input type="date" value={signatureDate ?? ''} onChange={e => onDateChange(e.target.value)}
              className="text-xs text-slate-400 border-0 bg-transparent mb-1 focus:outline-none" />
      )}

      <div className="w-full border-t border-slate-400 pt-1 text-center">
        {pdfMode
          ? <span className="text-xs text-slate-500">{title}</span>
          : onTitleChange
            ? <F pdfMode={pdfMode} value={title} className="text-xs text-slate-500 text-center" onChange={onTitleChange} />
            : <span className="text-xs text-slate-500">{title}</span>
        }
      </div>
    </div>
  )
}

// ─── Helpers ───
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-50">
      <td className="py-1 pr-3 text-slate-400 text-xs font-medium whitespace-nowrap w-20">{label}</td>
      <td className="py-1 text-slate-700">{children}</td>
    </tr>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <tr>
      <td className={`py-0.5 pr-2 text-right whitespace-nowrap ${muted ? 'text-xs text-slate-400' : 'text-slate-500'}`}>{label}</td>
      <td className={`py-0.5 text-right tabular-nums w-36 whitespace-nowrap ${muted ? 'text-slate-400 text-xs' : 'text-slate-700'}`}>{value}</td>
    </tr>
  )
}

function F({ value, onChange, className = '', multiline = false, pdfMode }: {
  value: string; onChange: (v: string) => void
  className?: string; multiline?: boolean; pdfMode: boolean
}) {
  if (pdfMode) {
    return multiline
      ? <p className={`whitespace-pre-wrap ${className}`}>{value}</p>
      : <span className={className}>{value}</span>
  }
  const base = `rounded px-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none ${className}`
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={`w-full resize-none border-0 bg-transparent ${base}`} />
    : <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`border-0 bg-transparent w-full ${base}`} />
}

function GripIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-8 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function LogoPlaceholder() {
  return (
    <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
