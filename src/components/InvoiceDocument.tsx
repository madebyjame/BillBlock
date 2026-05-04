import { createContext, useContext } from 'react'
import type { DocumentData } from '../types/document'
import type { DocumentAction } from '../store/documentStore'
import { DOCUMENT_TYPES } from '../types/document'
import { calcItemTotal, calcDocSummary, formatCurrency, formatDate, numberToThaiText } from '../utils/calculations'
import { generateId } from '../utils/idGenerator'

// ─── PDF mode context: เมื่อ true = ซ่อน UI chrome ทั้งหมด ───
export const PdfModeContext = createContext(false)

interface Props {
  doc: DocumentData
  dispatch: React.Dispatch<DocumentAction>
  docRef: React.RefObject<HTMLDivElement | null>
}

export default function InvoiceDocument({ doc, dispatch, docRef }: Props) {
  const pdfMode = useContext(PdfModeContext)
  const { subtotal, specialDiscount, vatAmount, total } = calcDocSummary(doc)
  const v = doc.visibility

  return (
    <div
      ref={docRef}
      className="mx-auto w-full bg-white font-sans"
      style={{ maxWidth: '794px', minHeight: '1123px', fontFamily: "'Sarabun', sans-serif" }}
    >
      <div className="p-10">

        {/* ═══════════════════════════════════════════
            SECTION 1 — Header (2 คอลัมน์)
            ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-6 mb-4">

          {/* ── ซ้าย: โลโก้ + ข้อมูลบริษัท ── */}
          <div>
            <div className="flex items-start gap-3 mb-5">
              {/* Logo */}
              <label className={`flex-shrink-0 flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 ${pdfMode ? 'pointer-events-none' : 'cursor-pointer hover:border-blue-300'}`}>
                {doc.company.logoUrl
                  ? <img src={doc.company.logoUrl} alt="logo" className="h-full w-full object-contain" />
                  : <LogoIcon />
                }
                {!pdfMode && (
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) dispatch({ type: 'UPDATE_COMPANY', data: { logoUrl: URL.createObjectURL(f) } })
                    }} />
                )}
              </label>

              {/* Company Info */}
              <div className="flex-1 text-sm">
                <F pdfMode={pdfMode}
                  value={doc.company.name}
                  onChange={v => dispatch({ type: 'UPDATE_COMPANY', data: { name: v } })}
                  className="font-bold text-slate-800 text-base" />
                {v.header.address && (
                  <F pdfMode={pdfMode} multiline
                    value={doc.company.address}
                    onChange={v => dispatch({ type: 'UPDATE_COMPANY', data: { address: v } })}
                    className="text-slate-500 mt-0.5" />
                )}
                {v.header.taxId && (
                  <F pdfMode={pdfMode}
                    value={`เลขประจำตัวผู้เสียภาษี ${doc.company.taxId}`}
                    onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { taxId: val.replace('เลขประจำตัวผู้เสียภาษี ', '') } })}
                    className="text-slate-500" />
                )}
                {v.header.phone && (
                  <F pdfMode={pdfMode}
                    value={`เบอร์มือถือ ${doc.company.phone}`}
                    onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { phone: val.replace('เบอร์มือถือ ', '') } })}
                    className="text-slate-500" />
                )}
                {v.header.email && (
                  <F pdfMode={pdfMode}
                    value={doc.company.email}
                    onChange={val => dispatch({ type: 'UPDATE_COMPANY', data: { email: val } })}
                    className="text-slate-500" />
                )}
              </div>
            </div>

            {/* ── ลูกค้า ── */}
            <div>
              <p className="text-blue-600 font-semibold text-sm mb-1">ลูกค้า</p>
              <F pdfMode={pdfMode}
                value={doc.customer.name}
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { name: val } })}
                className="font-semibold text-slate-800 text-sm" />
              <F pdfMode={pdfMode} multiline
                value={doc.customer.address}
                onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { address: val } })}
                className="text-slate-500 text-sm" />
              {v.customer.taxId && (
                <F pdfMode={pdfMode}
                  value={`เลขประจำตัวผู้เสียภาษี ${doc.customer.taxId}`}
                  onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { taxId: val.replace('เลขประจำตัวผู้เสียภาษี ', '') } })}
                  className="text-slate-500 text-sm" />
              )}
              {v.customer.branch && (
                <F pdfMode={pdfMode}
                  value={doc.customer.branch}
                  onChange={val => dispatch({ type: 'UPDATE_CUSTOMER', data: { branch: val } })}
                  className="text-slate-500 text-sm" />
              )}
            </div>
          </div>

          {/* ── ขวา: ชื่อเอกสาร + เลขที่/วันที่ ── */}
          <div className="relative">
            {/* Triangle decoration */}
            <div
              className="absolute top-0 right-0 w-0 h-0"
              style={{ borderStyle: 'solid', borderWidth: '0 70px 70px 0', borderColor: 'transparent #1d4ed8 transparent transparent' }}
            />

            {/* Document Type */}
            {pdfMode ? (
              <h1 className="text-3xl font-bold text-slate-800 mb-2 pr-16">{doc.docMeta.documentType}</h1>
            ) : (
              <select
                value={doc.docMeta.documentType}
                onChange={e => dispatch({ type: 'UPDATE_DOC_META', data: { documentType: e.target.value } })}
                className="text-3xl font-bold text-slate-800 mb-2 pr-16 bg-transparent border-0 cursor-pointer focus:outline-none hover:text-blue-700 w-full"
              >
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <div className="border-t border-slate-200 pt-2">
              <table className="w-full text-sm">
                <tbody>
                  <MetaRow label="เลขที่" pdfMode={pdfMode}>
                    <F pdfMode={pdfMode}
                      value={doc.docMeta.number}
                      onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { number: v } })}
                      className="text-slate-700 font-mono" />
                  </MetaRow>
                  <MetaRow label="วันที่" pdfMode={pdfMode}>
                    {pdfMode
                      ? <span className="text-slate-700">{formatDate(doc.docMeta.date)}</span>
                      : <input type="date" value={doc.docMeta.date}
                          onChange={e => dispatch({ type: 'UPDATE_DOC_META', data: { date: e.target.value } })}
                          className="border-0 bg-transparent text-sm text-slate-700 focus:outline-none" />
                    }
                  </MetaRow>
                  {v.docMeta.credit && (
                    <MetaRow label="เครดิต" pdfMode={pdfMode}>
                      <F pdfMode={pdfMode}
                        value={doc.docMeta.credit}
                        onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { credit: v } })}
                        className="text-slate-700" />
                    </MetaRow>
                  )}
                  {v.docMeta.salesperson && (
                    <MetaRow label="ผู้ขาย" pdfMode={pdfMode}>
                      <F pdfMode={pdfMode}
                        value={doc.docMeta.salesperson}
                        onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { salesperson: v } })}
                        className="text-slate-700" />
                    </MetaRow>
                  )}
                  {v.docMeta.projectName && (
                    <MetaRow label="ชื่องาน" pdfMode={pdfMode}>
                      <F pdfMode={pdfMode}
                        value={doc.docMeta.projectName}
                        onChange={v => dispatch({ type: 'UPDATE_DOC_META', data: { projectName: v } })}
                        className="text-slate-700" />
                    </MetaRow>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 2 — ตารางรายการ
            ═══════════════════════════════════════════ */}
        <div className="border-t border-b border-slate-200 mb-0">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-700 text-white">
                {v.table.no && <th className="px-3 py-2 text-left font-semibold w-8">#</th>}
                <th className="px-3 py-2 text-left font-semibold">รายละเอียด</th>
                <th className="px-3 py-2 text-right font-semibold w-20">จำนวน</th>
                {v.table.unit && <th className="px-3 py-2 text-center font-semibold w-16">หน่วย</th>}
                <th className="px-3 py-2 text-right font-semibold w-28">ราคาต่อหน่วย</th>
                {v.table.discount && <th className="px-3 py-2 text-right font-semibold w-20">ส่วนลด</th>}
                <th className="px-3 py-2 text-right font-semibold w-28">มูลค่า</th>
                {!pdfMode && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  {v.table.no && (
                    <td className="px-3 py-2 text-slate-400 text-center align-top">{idx + 1}</td>
                  )}
                  <td className="px-3 py-2 align-top">
                    {pdfMode ? (
                      <div>
                        <div className="text-slate-800">{item.description}</div>
                        {item.detail && <div className="text-slate-500 text-xs mt-0.5">{item.detail}</div>}
                      </div>
                    ) : (
                      <div>
                        <input type="text" value={item.description}
                          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'description', value: e.target.value })}
                          placeholder="ชื่อสินค้า/บริการ"
                          className="w-full border-0 bg-transparent text-slate-800 placeholder-slate-300 focus:outline-none" />
                        <input type="text" value={item.detail}
                          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'detail', value: e.target.value })}
                          placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                          className="w-full border-0 bg-transparent text-slate-400 text-xs placeholder-slate-200 focus:outline-none" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right align-top">
                    {pdfMode
                      ? <span>{item.quantity.toLocaleString()}</span>
                      : <input type="number" value={item.quantity} min={0}
                          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'quantity', value: parseFloat(e.target.value) || 0 })}
                          className="w-full border-0 bg-transparent text-right focus:outline-none" />
                    }
                  </td>
                  {v.table.unit && (
                    <td className="px-3 py-2 text-center align-top">
                      {pdfMode
                        ? <span>{item.unit}</span>
                        : <input type="text" value={item.unit}
                            onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unit', value: e.target.value })}
                            className="w-full border-0 bg-transparent text-center focus:outline-none" />
                      }
                    </td>
                  )}
                  <td className="px-3 py-2 text-right align-top">
                    {pdfMode
                      ? <span>{formatCurrency(item.unitPrice)}</span>
                      : <input type="number" value={item.unitPrice} min={0}
                          onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'unitPrice', value: parseFloat(e.target.value) || 0 })}
                          className="w-full border-0 bg-transparent text-right focus:outline-none" />
                    }
                  </td>
                  {v.table.discount && (
                    <td className="px-3 py-2 text-right align-top">
                      {pdfMode
                        ? <span>{item.discount > 0 ? `${item.discount}%` : '-'}</span>
                        : <input type="number" value={item.discount} min={0} max={100}
                            onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, field: 'discount', value: parseFloat(e.target.value) || 0 })}
                            className="w-full border-0 bg-transparent text-right focus:outline-none" />
                      }
                    </td>
                  )}
                  <td className="px-3 py-2 text-right align-top font-medium tabular-nums text-slate-700">
                    {formatCurrency(calcItemTotal(item))}
                  </td>
                  {!pdfMode && (
                    <td className="px-1 py-2 align-top">
                      <button onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
                        disabled={doc.items.length <= 1}
                        className="text-slate-200 hover:text-red-400 disabled:opacity-0 mt-0.5">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ปุ่มเพิ่มรายการ */}
          {!pdfMode && (
            <button
              onClick={() => dispatch({ type: 'ADD_ITEM' })}
              className="mx-3 my-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มรายการ
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 3 — คำอ่าน + หมายเหตุ | สรุปยอด
            ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">

          {/* ── ซ้าย: คำอ่าน + หมายเหตุ ── */}
          <div className="flex flex-col gap-3">
            {v.summary.thaiText && (
              <p className="text-slate-500 text-sm italic">({numberToThaiText(total)})</p>
            )}
            {v.summary.notes && (
              <div>
                <p className="text-blue-600 font-semibold text-sm mb-0.5">หมายเหตุ</p>
                {pdfMode
                  ? <p className="text-slate-600 text-sm whitespace-pre-wrap">{doc.notes}</p>
                  : <textarea
                      value={doc.notes}
                      onChange={e => dispatch({ type: 'UPDATE_NOTES', notes: e.target.value })}
                      placeholder="ระบุหมายเหตุ / เงื่อนไขเพิ่มเติม..."
                      rows={3}
                      className="w-full border-0 bg-transparent text-sm text-slate-600 placeholder-slate-300 resize-none focus:outline-none"
                    />
                }
              </div>
            )}
          </div>

          {/* ── ขวา: สรุปยอด ── */}
          <div className="flex flex-col items-end">
            <table className="w-full text-sm">
              <tbody>
                <SummaryRow label="รวมเป็นเงิน" value={`${formatCurrency(subtotal)} บาท`} />
                {v.summary.specialDiscount && (
                  <tr>
                    <td className="py-1 pr-4 text-right text-slate-500">ส่วนลดพิเศษ</td>
                    <td className="py-1 text-right text-slate-700 tabular-nums w-36">
                      {pdfMode
                        ? `${formatCurrency(specialDiscount)} บาท`
                        : <span className="flex items-center justify-end gap-1">
                            <input type="number" value={doc.summary.specialDiscount} min={0}
                              onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { specialDiscount: parseFloat(e.target.value) || 0 } })}
                              className="w-24 border-b border-slate-200 bg-transparent text-right focus:border-blue-400 focus:outline-none" />
                            <span className="text-slate-400">฿</span>
                          </span>
                      }
                    </td>
                  </tr>
                )}
                {v.summary.vat && (
                  <tr>
                    <td className="py-1 pr-4 text-right text-slate-500">
                      {pdfMode
                        ? `ภาษีมูลค่าเพิ่ม ${doc.summary.vatRate}%`
                        : <span className="flex items-center justify-end gap-1">
                            ภาษีมูลค่าเพิ่ม
                            <input type="number" value={doc.summary.vatRate} min={0} max={100}
                              onChange={e => dispatch({ type: 'UPDATE_SUMMARY', data: { vatRate: parseFloat(e.target.value) || 0 } })}
                              className="w-10 border-b border-slate-200 bg-transparent text-center focus:border-blue-400 focus:outline-none" />
                            %
                          </span>
                      }
                    </td>
                    <td className="py-1 text-right text-slate-700 tabular-nums w-36">{formatCurrency(vatAmount)} บาท</td>
                  </tr>
                )}
                <tr className="border-t border-slate-200">
                  <td className="pt-2 pr-4 text-right font-bold text-slate-800">จำนวนเงินรวมทั้งสิ้น</td>
                  <td className="pt-2 text-right font-bold text-blue-700 tabular-nums w-36 text-base">{formatCurrency(total)} บาท</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 4 — ลายเซ็น
            ═══════════════════════════════════════════ */}
        <div className={`grid gap-6 mt-8 ${v.footer.buyerSignature ? 'grid-cols-2' : 'grid-cols-1 max-w-xs ml-auto'}`}>

          {/* ── ลายเซ็นผู้ซื้อ ── */}
          {v.footer.buyerSignature && (
            <div className="flex flex-col items-center">
              {pdfMode
                ? <p className="text-sm text-slate-600 mb-6">{doc.footer.buyerLabel}</p>
                : <F pdfMode={pdfMode} value={doc.footer.buyerLabel}
                    onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { buyerLabel: v } })}
                    className="text-sm text-slate-600 mb-6 text-center" />
              }
              <div className="w-full border-t border-slate-400 pt-1">
                <div className="flex justify-around text-xs text-slate-500">
                  <span>ผู้สั่งซื้อสินค้า</span>
                  <span>วันที่</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ลายเซ็นผู้อนุมัติ ── */}
          <div className="flex flex-col items-center">
            {pdfMode
              ? <p className="text-sm text-slate-600 mb-2">{doc.footer.sellerLabel}</p>
              : <F pdfMode={pdfMode} value={doc.footer.sellerLabel}
                  onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { sellerLabel: v } })}
                  className="text-sm text-slate-600 mb-2 text-center" />
            }

            {/* ลายเซ็น + ตราประทับ */}
            <div className="relative flex justify-center items-end h-16 w-full mb-1">
              {doc.footer.signatureUrl
                ? <img src={doc.footer.signatureUrl} alt="signature" className="h-14 object-contain" />
                : !pdfMode && (
                  <label className="flex h-14 w-32 cursor-pointer items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-300 hover:border-blue-300">
                    คลิกอัปโหลดลายเซ็น
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) dispatch({ type: 'UPDATE_FOOTER', data: { signatureUrl: URL.createObjectURL(f) } })
                      }} />
                  </label>
                )}

              {/* ตราประทับ */}
              {v.footer.stamp && (
                <label className={`absolute right-4 bottom-0 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-200 overflow-hidden ${pdfMode ? 'pointer-events-none' : 'cursor-pointer hover:border-blue-300'}`}>
                  {doc.footer.stampUrl
                    ? <img src={doc.footer.stampUrl} alt="stamp" className="h-full w-full object-contain" />
                    : !pdfMode && <span className="text-[9px] text-slate-300 text-center">ตรา</span>
                  }
                  {!pdfMode && (
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) dispatch({ type: 'UPDATE_FOOTER', data: { stampUrl: URL.createObjectURL(f) } })
                      }} />
                  )}
                </label>
              )}
            </div>

            {/* วันที่ลงนาม */}
            {pdfMode
              ? <p className="text-xs text-slate-500 mb-1">{formatDate(doc.footer.signatureDate)}</p>
              : <input type="date" value={doc.footer.signatureDate}
                  onChange={e => dispatch({ type: 'UPDATE_FOOTER', data: { signatureDate: e.target.value } })}
                  className="text-xs text-slate-500 border-0 bg-transparent mb-1 focus:outline-none" />
            }

            <div className="w-full border-t border-slate-400 pt-1">
              <div className="flex justify-around text-xs text-slate-500">
                {pdfMode
                  ? <span>{doc.footer.approverName}</span>
                  : <F pdfMode={pdfMode} value={doc.footer.approverName}
                      onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { approverName: v } })}
                      className="text-xs text-slate-500" />
                }
                <span>วันที่</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ข้อมูลธนาคาร (optional) ─── */}
        {v.footer.bankInfo && (
          <div className="mt-6 rounded border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">ชำระเงินผ่าน</p>
            <F pdfMode={pdfMode} value={doc.footer.bankName}
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { bankName: v } })}
              className="inline" />
            {' · '}
            <F pdfMode={pdfMode} value={doc.footer.accountName}
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { accountName: v } })}
              className="inline" />
            {' · '}
            <F pdfMode={pdfMode} value={doc.footer.accountNumber}
              onChange={v => dispatch({ type: 'UPDATE_FOOTER', data: { accountNumber: v } })}
              className="inline font-mono" />
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Helper: inline editable field ───
function F({
  value, onChange, className = '', multiline = false, pdfMode,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  multiline?: boolean
  pdfMode: boolean
}) {
  if (pdfMode) {
    return multiline
      ? <p className={`whitespace-pre-wrap ${className}`}>{value}</p>
      : <span className={className}>{value}</span>
  }

  const base = `rounded px-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all ${className}`

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className={`w-full resize-none border-0 bg-transparent ${base}`}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border-0 bg-transparent w-full ${base}`}
    />
  )
}

// ─── Helper: row ใน doc meta table ───
function MetaRow({ label, children, pdfMode }: { label: string; children: React.ReactNode; pdfMode: boolean }) {
  void pdfMode
  return (
    <tr className="border-b border-slate-50">
      <td className="py-1 pr-4 text-slate-400 font-medium text-xs whitespace-nowrap w-24">{label}</td>
      <td className="py-1 text-slate-700">{children}</td>
    </tr>
  )
}

// ─── Helper: row ใน summary table ───
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-4 text-right text-slate-500">{label}</td>
      <td className="py-1 text-right text-slate-700 tabular-nums w-36">{value}</td>
    </tr>
  )
}

function LogoIcon() {
  return (
    <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

// Needed for generateId in ADD_ITEM
void generateId
