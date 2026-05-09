import { createContext, useCallback, useContext, useMemo } from 'react'
import { PlanContext } from '../context/PlanContext'
import { useEditorCallbacks } from '../context/EditorCallbacksContext'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import type { DocumentData, CatalogItem, DocumentBlock } from '../types/document'
import { defaultDocument } from '../types/document'
import type { DocumentAction } from '../store/documentStore'
import type { CustomerRow } from '../lib/customerApi'
import type { ProductRow } from '../lib/productApi'
import {
  calcDocSummary, formatNumber, formatDate, numberToThaiText,
} from '../utils/calculations'
import { readImageFileAsDataUrl } from '../utils/fileToDataUrl'
import { GripIcon, XSmallIcon, LogoPlaceholder } from './document/DocumentIcons'
import { F, CustomerLookupInput, DiscountInput } from './document/InvoiceInputs'
import { SortableRow, StaticRow, MetaRow, SummaryRow } from './document/InvoiceRows'
import { SignatureBox } from './document/SignatureBox'

export const PdfModeContext = createContext(false)

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
  docRef: React.RefObject<HTMLDivElement | null>
  catalog: CatalogItem[]
  customers: CustomerRow[]
  products: ProductRow[]
  onQuickAddCustomer?: (name: string) => void
  autoFocusCustomer?: boolean
}

function DocumentWatermark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bb-wm" x="0" y="0" width="300" height="200"
            patternUnits="userSpaceOnUse" patternTransform="rotate(-35 0 0)">
            <text x="10" y="60" fontSize="52" fontWeight="bold"
              fill="rgba(0,0,0,0.055)" fontFamily="system-ui,sans-serif"
              letterSpacing="3">BillBlock</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bb-wm)" />
      </svg>
    </div>
  )
}

export default function InvoiceDocument({ doc, dispatch, docRef, catalog, customers, products, onQuickAddCustomer, autoFocusCustomer }: Props) {
  const pdfMode = useContext(PdfModeContext)
  const planCtx = useContext(PlanContext)
  const editorCallbacks = useEditorCallbacks()
  const showWatermark = planCtx?.plan === 'free'
  
  // ป้องกันกรณี doc หรือ nested objects เป็น undefined/null แม้จะผ่าน normalize มาแล้ว
  const v = doc?.visibility || defaultDocument.visibility
  const tc = doc?.settings?.themeColor || defaultDocument.settings.themeColor
  const sym = doc?.settings?.currencySymbol || defaultDocument.settings.currencySymbol

  const docItems = doc?.items
  const docSummaryMeta = doc?.summary
  const docVatMode = doc?.settings?.vatMode
  const docVisibilitySummary = doc?.visibility?.summary

  const { subtotal, specialDiscountAmt, vatAmount, preTaxAmount, total } = useMemo(
    () => calcDocSummary(doc ?? defaultDocument),
    [doc, docItems, docSummaryMeta, docVatMode, docVisibilitySummary],
  )

  // ─── Row DnD sensors ───
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const items = doc.items

  const handleRowDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(i => i.id === active.id)
    const newIdx = items.findIndex(i => i.id === over.id)
    dispatch({ type: 'REORDER_ITEMS', ids: arrayMove(items, oldIdx, newIdx).map(i => i.id) })
  }, [items, dispatch])

  return (
    <div
      ref={docRef}
      className="mx-auto w-full bg-white flex flex-col relative"
      style={{ maxWidth: '794px', minHeight: '1123px', fontFamily: "'Sarabun', sans-serif", fontSize: '14px' }}
    >
      {showWatermark && <DocumentWatermark />}
      <div className="p-10 flex-1 flex flex-col">

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
                    editorCallbacks.onLogoSave(f)
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
                {v.header.taxId && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="shrink-0">เลขประจำตัวผู้เสียภาษี</span>
                    <F pdfMode={pdfMode} value={doc.company.taxId}
                      onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { taxId: val } })} />
                  </div>
                )}
                {v.header.phone && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="shrink-0">เบอร์โทร</span>
                    <F pdfMode={pdfMode} value={doc.company.phone}
                      onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { phone: val } })} />
                  </div>
                )}
                {v.header.email && <F pdfMode={pdfMode} value={doc.company.email} className="text-slate-500"
                  onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { email: val } })} />}
              </div>
            </div>

            {/* Customer */}
            <div className="text-sm leading-relaxed">
              <p className="font-semibold mb-1" style={{ color: tc }}>ลูกค้า</p>
              <CustomerLookupInput
                pdfMode={pdfMode}
                customer={doc.customer}
                customers={customers}
                onChange={(data) => dispatch({ type: 'UPDATE_CUSTOMER', data })}
                onQuickAdd={onQuickAddCustomer}
                autoFocus={autoFocusCustomer}
              />
              <F pdfMode={pdfMode} multiline value={doc.customer.address} className="text-slate-500"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { address: val } })} />
              {v.customer.taxId && (
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="shrink-0">เลขประจำตัวผู้เสียภาษี</span>
                  <F pdfMode={pdfMode} value={doc.customer.taxId}
                    onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { taxId: val } })} />
                </div>
              )}
              {v.customer.branch && <F pdfMode={pdfMode} value={doc.customer.branch} className="text-slate-500"
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { branch: val } })} />}
            </div>
          </div>

          {/* ── ขวา: ชื่อเอกสาร + meta ── */}
          <div className="relative">
            {/* Triangle */}
            <div className="absolute top-0 right-0 w-0 h-0"
              style={{ borderStyle: 'solid', borderWidth: '0 70px 70px 0', borderColor: `transparent ${tc} transparent transparent` }} />

            {/* Document type — ล็อคแล้ว ไม่เปลี่ยนได้ */}
            <h1 className="text-3xl font-bold text-slate-800 mb-3 pr-16">{doc.docMeta.documentType}</h1>

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
                        dispatch={dispatch} catalog={catalog} products={products} v={v} />
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

        {/* ═══ SECTION 3: Thai text | Summary ═══ */}
        <div className="py-4 border-b border-slate-200">
          {!pdfMode && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', path: 'summary.vat' })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  v.summary.vat
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-6 rounded-full relative overflow-hidden transition-colors ${v.summary.vat ? 'bg-blue-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0 h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${v.summary.vat ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                </span>
                VAT 7%
              </button>
            </div>
          )}
          <div className={`grid gap-8 ${v.summary.thaiText ? 'grid-cols-2' : ''}`}>
            {v.summary.thaiText && (
              <div className="flex items-center text-sm">
                <p className="text-slate-500 italic">({numberToThaiText(total)})</p>
              </div>
            )}
            <div className={v.summary.thaiText ? '' : 'ml-auto w-1/2'}>
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
                          : <DiscountInput value={doc.summary.specialDiscount} discountType={doc.summary.specialDiscountType} sym={sym}
                              onValue={v => dispatch({ type: 'UPDATE_SUMMARY', data: { specialDiscount: v } })}
                              onType={t => dispatch({ type: 'UPDATE_SUMMARY', data: { specialDiscountType: t } })} />}
                      </td>
                    </tr>
                  )}
                  {v.summary.vat && (
                    <>
                      {doc.settings.vatMode === 'inclusive' && (
                        <SummaryRow label="ราคาก่อน VAT" value={`${formatNumber(preTaxAmount)} ${sym}`} muted />
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
                              </span>}
                        </td>
                        <td className="py-1 text-right tabular-nums w-36 text-slate-700">{formatNumber(vatAmount)} {sym}</td>
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
        </div>

        {/* ═══ SECTION 4: Block Canvas — optional blocks, always pushed to bottom ═══ */}
        <div className="mt-auto">
          <BlockCanvas doc={doc} dispatch={dispatch} pdfMode={pdfMode} tc={tc} v={v} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Block Canvas — sortable + droppable zone
// ─────────────────────────────────────────
export function BlockCanvas({ doc, dispatch, pdfMode, tc, v }: {
  doc: DocumentData; dispatch: React.Dispatch<DocumentAction>
  pdfMode: boolean; tc: string; v: DocumentData['visibility']
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'block-zone' })
  return (
    <div ref={setNodeRef} className="relative pt-2 pb-4">
      {isOver && !pdfMode && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-300 bg-blue-50/40 pointer-events-none"
          style={{ animation: 'drop-glow 0.8s ease infinite' }} />
      )}
      {!pdfMode && doc.blocks.length === 0 && (
        <div className="flex items-center justify-center py-8 rounded-xl border-2 border-dashed my-3 transition-colors duration-200"
          style={{ borderColor: isOver ? '#93c5fd' : '#e2e8f0', backgroundColor: isOver ? '#eff6ff' : 'transparent' }}>
          <p className="text-sm text-slate-300 select-none">← ลาก Block มาวางที่นี่</p>
        </div>
      )}
      <SortableContext items={doc.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {doc.blocks.map(block => (
          <SortableBlock key={block.id} block={block} doc={doc} dispatch={dispatch} pdfMode={pdfMode} tc={tc} v={v} />
        ))}
      </SortableContext>
    </div>
  )
}

function SortableBlock({ block, doc, dispatch, pdfMode, tc, v }: {
  block: DocumentBlock; doc: DocumentData; dispatch: React.Dispatch<DocumentAction>
  pdfMode: boolean; tc: string; v: DocumentData['visibility']
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  return (
    <div ref={setNodeRef}
      style={pdfMode ? undefined : { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      className={pdfMode ? 'relative' : 'group/blk relative block-enter'}>
      {!pdfMode && (
        <button {...attributes} {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 cursor-grab touch-none opacity-0 group-hover/blk:opacity-100 transition-opacity text-slate-300 hover:text-slate-500 active:cursor-grabbing">
          <GripIcon />
        </button>
      )}
      {!pdfMode && (
        <button onClick={() => dispatch({ type: 'REMOVE_BLOCK', id: block.id })}
          className="absolute top-1 right-1 z-10 opacity-0 group-hover/blk:opacity-100 transition-opacity text-slate-300 hover:text-red-500 rounded p-0.5 hover:bg-red-50">
          <XSmallIcon />
        </button>
      )}
      <BlockContent block={block} doc={doc} dispatch={dispatch} pdfMode={pdfMode} tc={tc} v={v} />
    </div>
  )
}

function BlockContent({ block, doc, dispatch, pdfMode, tc, v }: {
  block: DocumentBlock; doc: DocumentData; dispatch: React.Dispatch<DocumentAction>
  pdfMode: boolean; tc: string; v: DocumentData['visibility']
}) {
  switch (block.type) {
    case 'notes':
      return (
        <div className="pt-4 pb-2 text-sm">
          <p className="font-semibold mb-1" style={{ color: tc }}>หมายเหตุ</p>
          {pdfMode
            ? <p className="text-slate-600 whitespace-pre-wrap">{doc.notes}</p>
            : <textarea value={doc.notes} rows={3}
                onChange={e => dispatch({ type: 'UPDATE_NOTES', notes: e.target.value })}
                placeholder="ระบุหมายเหตุ / เงื่อนไขเพิ่มเติม..."
                className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-300 resize-none focus:outline-none" />}
        </div>
      )
    case 'signature':
      return (
        <div data-pdf-no-break style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          className={`grid gap-8 pt-6 ${v.footer.buyerSignature ? 'grid-cols-2' : 'grid-cols-1 max-w-xs ml-auto'}`}>
          {v.footer.buyerSignature && (
            <SignatureBox pdfMode={pdfMode} label={doc.footer.buyerLabel} title={doc.footer.buyerTitle}
              onLabelChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { buyerLabel: val } })}
              onTitleChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { buyerTitle: val } })} />
          )}
          <SignatureBox pdfMode={pdfMode}
            label={doc.footer.sellerLabel} title={doc.footer.approverName}
            onLabelChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { sellerLabel: val } })}
            onTitleChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { approverName: val } })}
            signatureUrl={doc.footer.signatureUrl} signatureScale={doc.footer.signatureScale}
            onScaleChange={s => dispatch({ type: 'UPDATE_FOOTER', data: { signatureScale: s } })}
            stampUrl={v.footer.stamp ? doc.footer.stampUrl : undefined}
            signatureDate={doc.footer.signatureDate} showStamp={v.footer.stamp}
            onSignatureUpload={url => dispatch({ type: 'UPDATE_FOOTER', data: { signatureUrl: url } })}
            onStampUpload={url => dispatch({ type: 'UPDATE_FOOTER', data: { stampUrl: url } })}
            onDateChange={d => dispatch({ type: 'UPDATE_FOOTER', data: { signatureDate: d } })} />
        </div>
      )
    case 'bankInfo':
      return (
        <div data-pdf-no-break style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          className={`mt-4 rounded border p-3 text-xs ${pdfMode ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
          <p className={`font-semibold mb-1 ${pdfMode ? 'text-slate-900' : 'text-slate-600'}`}>ชำระเงินผ่าน</p>
          <F pdfMode={pdfMode} value={doc.footer.bankName} className="inline"
            onChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { bankName: val } })} />
          {' · '}
          <F pdfMode={pdfMode} value={doc.footer.accountName} className="inline"
            onChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { accountName: val } })} />
          {' · '}
          <F pdfMode={pdfMode} value={doc.footer.accountNumber} className="inline font-mono"
            onChange={val => dispatch({ type: 'UPDATE_FOOTER', data: { accountNumber: val } })} />
        </div>
      )
    case 'customText':
      return (
        <div className="pt-4 pb-2 text-sm">
          {pdfMode
            ? <>
                {block.heading && <p className="font-semibold mb-1" style={{ color: tc }}>{block.heading}</p>}
                <p className="text-slate-600 whitespace-pre-wrap">{block.content}</p>
              </>
            : <>
                <input value={block.heading ?? ''} placeholder="หัวข้อ (ไม่บังคับ)"
                  onChange={e => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data: { heading: e.target.value } })}
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 placeholder-slate-300 focus:outline-none mb-1" />
                <textarea value={block.content ?? ''} rows={3} placeholder="พิมพ์ข้อความที่นี่..."
                  onChange={e => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data: { content: e.target.value } })}
                  className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-300 resize-none focus:outline-none" />
              </>}
        </div>
      )
    case 'divider':
      return <div className="my-4 border-t border-slate-200" />
    default:
      return null
  }
}

