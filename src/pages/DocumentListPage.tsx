import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus, Plus, Search, ChevronDown, MoreVertical,
  Eye, Pencil, Download, Trash2, Clock, CheckCircle2, XCircle, Copy, ArrowRightLeft,
  TrendingUp, Hourglass, AlertCircle, FileSpreadsheet, Lock, CreditCard, Mail,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import UpgradeModal from '../components/UpgradeModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { PlanLimitError } from '../lib/planLimits'
import { useConfirm } from '../hooks/useConfirm'
import { useDocumentsByType } from '../hooks/useDocumentsByType'
import { createDocument, deleteDocument, updateDocumentStatus, duplicateDocument, convertToInvoice, convertToReceipt, convertToTaxInvoice } from '../lib/documentApi'
import { exportDocumentsToExcel } from '../lib/excelExport'
import { usePlan } from '../hooks/usePlan'
import type { DocumentRow } from '../lib/documentApi'
import type { DocTypeCode } from '../types/document'
import { DOC_TYPE_CODES } from '../types/document'
import type { DocListRow } from '../hooks/useDocumentsByType'
import PaymentModal from '../components/PaymentModal'
import SendEmailModal from '../components/SendEmailModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_CREATE_LABEL: Record<DocTypeCode, string> = {
  quotation:      'สร้างใบเสนอราคา',
  invoice:        'สร้างใบแจ้งหนี้',
  receipt:        'สร้างใบเสร็จรับเงิน',
  'billing-note': 'สร้างใบวางบิล',
  'tax-invoice':  'สร้างใบกำกับภาษี',
  'credit-note':  'สร้างใบลดหนี้',
}

const STATUS_LABEL: Record<DocumentRow['status'], string> = {
  draft:     'ฉบับร่าง',
  sent:      'ส่งแล้ว',
  paid:      'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const QUOTATION_STATUS_LABEL: Record<DocumentRow['status'], string> = {
  draft:     'ฉบับร่าง',
  sent:      'รอตัดสินใจ',
  paid:      'อนุมัติแล้ว',
  cancelled: 'ปฏิเสธ',
}

const STATUS_CLASS: Record<DocumentRow['status'], string> = {
  draft:     'bg-slate-200 text-slate-700',
  sent:      'bg-amber-100 text-amber-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const STATUS_ICON: Record<DocumentRow['status'], ReactNode> = {
  draft:     <Pencil size={9} className="shrink-0" />,
  sent:      <Clock size={9} className="shrink-0" />,
  paid:      <CheckCircle2 size={9} className="shrink-0" />,
  cancelled: <XCircle size={9} className="shrink-0" />,
}

const ALL_STATUSES = ['draft', 'sent', 'paid', 'cancelled'] as const

const PAGE_SIZE = 10

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isOverdue(row: { status: DocumentRow['status']; due_date: string | null }): boolean {
  return row.status === 'sent' && row.due_date != null && row.due_date < new Date().toISOString().split('T')[0]
}

function statusLabel(status: DocumentRow['status'], docType: DocTypeCode) {
  return docType === 'quotation' ? QUOTATION_STATUS_LABEL[status] : STATUS_LABEL[status]
}

// ─── Clickable Status Badge ───────────────────────────────────────────────────

function StatusBadge({
  row, docType, updating, onChangeStatus,
}: {
  row: DocListRow
  docType: DocTypeCode
  updating: boolean
  onChangeStatus: (id: string, status: DocumentRow['status']) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick() { setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen(e: MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  const label = statusLabel(row.status, docType)

  return (
    <>
      <button
        ref={btnRef}
        disabled={updating}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50 ${STATUS_CLASS[row.status]}`}
      >
        {STATUS_ICON[row.status]}
        {label}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                if (s !== row.status) onChangeStatus(row.id, s)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-slate-50 ${s === row.status ? 'font-semibold' : ''}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s === 'draft' ? 'bg-slate-400' : s === 'sent' ? 'bg-amber-400' : s === 'paid' ? 'bg-green-400' : 'bg-red-400'}`} />
              {statusLabel(s, docType)}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Kebab Menu ───────────────────────────────────────────────────────────────

interface ConvertOption { label: string; toType: DocTypeCode }

function KebabMenu({
  row, deleting, duplicating, converting,
  onDelete, onNavigate, onDuplicate, onConvert, onPayment, onEmail, converts,
}: {
  row: DocListRow
  deleting: boolean
  duplicating?: boolean
  converting?: boolean
  onDelete: (e: MouseEvent<HTMLButtonElement>, id: string) => void
  onNavigate: (id: string) => void
  onDuplicate: (id: string) => void
  onConvert?: (id: string, toType?: DocTypeCode) => void
  onPayment?: (id: string, total: number, docNumber: string) => void
  onEmail?: (row: DocListRow) => void
  converts?: ConvertOption[]
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick() { setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen(e: MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.right - 176 })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        disabled={deleting}
        onClick={handleOpen}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
        aria-label="เมนู"
      >
        <MoreVertical size={15} />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50">
            <Eye size={13} className="text-slate-400" /> ดูรายละเอียด
          </button>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50">
            <Pencil size={13} className="text-slate-400" /> แก้ไข
          </button>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50">
            <Download size={13} className="text-slate-400" /> ดาวน์โหลด PDF
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDuplicate(row.id) }}
            disabled={duplicating}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
            <Copy size={13} className="text-slate-400" />
            {duplicating ? 'กำลังทำซ้ำ…' : 'ทำซ้ำเอกสาร'}
          </button>
          {converts?.map(c => (
            <button key={c.toType}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onConvert?.(row.id, c.toType) }}
              disabled={converting}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">
              <ArrowRightLeft size={13} className="text-slate-400" />
              {converting ? 'กำลังแปลง…' : c.label}
            </button>
          ))}
          {(row.doc_type === 'invoice' || row.doc_type === 'billing-note') && onPayment && row.status !== 'cancelled' && (
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onPayment(row.id, row.total_amount, row.doc_number) }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-blue-600 transition-colors hover:bg-blue-50">
              <CreditCard size={13} />
              บันทึกชำระเงิน
            </button>
          )}
          {onEmail && (
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEmail(row) }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50">
              <Mail size={13} className="text-slate-400" />
              ส่งอีเมลลูกค้า
            </button>
          )}
          <div className="my-1 border-t border-slate-100" />
          <button onClick={(e) => { setOpen(false); onDelete(e, row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 transition-colors hover:bg-red-50">
            <Trash2 size={13} /> ลบเอกสาร
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onPage }: {
  page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void
}) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-400">
        แสดง {from}–{to} จาก <span className="font-medium text-slate-600">{total}</span> รายการ
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => onPage(page - 1)}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30">
            ‹ ก่อนหน้า
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1 text-xs text-slate-300">…</span>
            ) : (
              <button key={p} onClick={() => onPage(p as number)}
                className={`min-w-7 rounded-lg px-2 py-1 text-xs transition-colors ${p === page ? 'bg-slate-800 font-semibold text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {p}
              </button>
            )
          )}
          <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30">
            ถัดไป ›
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props { docType: DocTypeCode }

export default function DocumentListPage({ docType }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isPro, isBusiness } = usePlan()
  const { rows, loading, error, refetch } = useDocumentsByType(docType)

  const { confirm, pending: confirmPending, onConfirm, onCancel } = useConfirm()

  const [creating, setCreating] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{ resource: 'documents'; limit: number } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [paymentDoc, setPaymentDoc] = useState<{ id: string; total: number; title: string } | null>(null)
  const [emailDoc, setEmailDoc] = useState<DocListRow | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DocumentRow['status'] | 'all' | 'overdue'>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [page, setPage] = useState(1)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  const pageTitle = DOC_TYPE_CODES[docType]
  const createLabel = DOC_CREATE_LABEL[docType]
  const isQuotation = docType === 'quotation'

  const filtered = useMemo(() => rows.filter((row) => {
    if (search) {
      const q = search.toLowerCase()
      if (!row.doc_number.toLowerCase().includes(q) &&
          !row.customer_name.toLowerCase().includes(q) &&
          !row.project_name.toLowerCase().includes(q)) return false
    }
    if (filterStatus === 'overdue') {
      if (!isOverdue(row)) return false
    } else if (filterStatus !== 'all' && row.status !== filterStatus) return false
    if (filterDateFrom && row.created_at < filterDateFrom) return false
    if (filterDateTo && row.created_at > filterDateTo + 'T23:59:59') return false
    return true
  }), [rows, search, filterStatus, filterDateFrom, filterDateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const allPageSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.id))

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, filterStatus, filterDateFrom, filterDateTo])
  // Reset selections when page changes
  useEffect(() => { setSelectedIds(new Set()) }, [page])

  // Summary cards per doc type
  type SummaryCard = { label: string; value: number; color: string; icon: string }
  const summary: SummaryCard[] = useMemo(() => {
    const sum = (arr: DocListRow[]) => arr.reduce((s, r) => s + r.total_amount, 0)
    const byStatus = {
      draft:     rows.filter(r => r.status === 'draft'),
      sent:      rows.filter(r => r.status === 'sent'),
      paid:      rows.filter(r => r.status === 'paid'),
      cancelled: rows.filter(r => r.status === 'cancelled'),
    }
    const overdueRows = rows.filter(r => isOverdue(r))

    if (docType === 'quotation') {
      return [
        { label: `รอตัดสินใจ (${byStatus.sent.length} ใบ)`,  value: sum(byStatus.sent),      color: 'amber',  icon: 'hourglass'  },
        { label: `อนุมัติแล้ว (${byStatus.paid.length} ใบ)`, value: sum(byStatus.paid),      color: 'green',  icon: 'trending'   },
        { label: `ฉบับร่าง (${byStatus.draft.length} ใบ)`,   value: sum(byStatus.draft),     color: 'slate',  icon: 'pencil'     },
        { label: `ปฏิเสธ (${byStatus.cancelled.length} ใบ)`, value: sum(byStatus.cancelled), color: 'red',    icon: 'xcircle'    },
      ]
    }
    if (docType === 'invoice') {
      return [
        { label: `ค้างชำระ (${byStatus.sent.length} ใบ)`,      value: sum(byStatus.sent),      color: 'amber', icon: 'hourglass' },
        { label: `ชำระแล้ว (${byStatus.paid.length} ใบ)`,      value: sum(byStatus.paid),      color: 'green', icon: 'trending'  },
        { label: `เกินกำหนด (${overdueRows.length} ใบ)`,        value: sum(overdueRows),        color: 'red',   icon: 'alert'     },
        { label: `ฉบับร่าง (${byStatus.draft.length} ใบ)`,     value: sum(byStatus.draft),     color: 'slate', icon: 'pencil'    },
      ]
    }
    if (docType === 'receipt') {
      return [
        { label: `ทั้งหมด (${rows.length} ใบ)`,             value: sum(rows),           color: 'blue',  icon: 'trending'  },
        { label: `ชำระแล้ว (${byStatus.paid.length} ใบ)`,   value: sum(byStatus.paid),  color: 'green', icon: 'checkmark' },
      ]
    }
    if (docType === 'billing-note') {
      return [
        { label: `รอชำระ (${byStatus.sent.length} ใบ)`,     value: sum(byStatus.sent),  color: 'amber', icon: 'hourglass' },
        { label: `ชำระแล้ว (${byStatus.paid.length} ใบ)`,   value: sum(byStatus.paid),  color: 'green', icon: 'trending'  },
      ]
    }
    if (docType === 'tax-invoice') {
      const issued = [...byStatus.sent, ...byStatus.paid]
      return [
        { label: `ออกแล้ว (${issued.length} ใบ)`,           value: sum(issued),         color: 'blue',  icon: 'trending'  },
        { label: `ยอดภาษีขาย (VAT 7%)`,                     value: sum(issued) * 0.07,  color: 'slate', icon: 'checkmark' },
      ]
    }
    if (docType === 'credit-note') {
      return [
        { label: `ใบลดหนี้ทั้งหมด (${rows.length} ใบ)`,   value: sum(rows),           color: 'red',   icon: 'xcircle'   },
      ]
    }
    return []
  }, [rows, docType])

  function toggleAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) paginated.forEach(r => next.delete(r.id))
      else paginated.forEach(r => next.add(r.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!user || creating) return
    setCreating(true)
    try {
      const id = await createDocument(user.id, docType)
      navigate(`/editor/${id}`)
    } catch (err) {
      if (err instanceof PlanLimitError) {
        setUpgradeModal({ resource: 'documents', limit: err.limit })
      } else {
        toast.error('สร้างเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      }
      setCreating(false)
    }
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation()
    if (!await confirm({ message: 'เอกสารนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้', confirmLabel: 'ลบเอกสาร', danger: true })) return
    setDeletingId(id)
    try { await deleteDocument(id); refetch() }
    finally { setDeletingId(null) }
  }

  async function handleBulkDelete() {
    if (!await confirm({ message: `เอกสาร ${selectedIds.size} รายการจะถูกลบถาวร ไม่สามารถกู้คืนได้`, confirmLabel: `ลบ ${selectedIds.size} รายการ`, danger: true })) return
    try {
      await Promise.all([...selectedIds].map(id => deleteDocument(id)))
      toast.success(`ลบ ${selectedIds.size} รายการแล้ว`)
      setSelectedIds(new Set())
      refetch()
    } catch { toast.error('ลบไม่สำเร็จ กรุณาลองใหม่') }
  }

  async function handleBulkStatusChange(status: DocumentRow['status']) {
    if (!await confirm({ message: `เปลี่ยนสถานะ ${selectedIds.size} รายการ เป็น "${statusLabel(status, docType)}"?`, confirmLabel: 'เปลี่ยนสถานะ' })) return
    setBulkUpdating(true)
    try {
      await Promise.all([...selectedIds].map(id => updateDocumentStatus(id, status)))
      toast.success(`อัปเดต ${selectedIds.size} รายการเรียบร้อย`)
      setSelectedIds(new Set())
      refetch()
    } catch { toast.error('อัปเดตสถานะไม่สำเร็จ') }
    finally { setBulkUpdating(false) }
  }

  async function handleChangeStatus(id: string, status: DocumentRow['status']) {
    setUpdatingStatusId(id)
    try {
      await updateDocumentStatus(id, status)
      toast.success(`อัปเดตสถานะเป็น "${statusLabel(status, docType)}" เรียบร้อย`, { id: 'status-update' })
      refetch()
    } catch {
      toast.error('อัปเดตสถานะไม่สำเร็จ', { id: 'status-update' })
    } finally { setUpdatingStatusId(null) }
  }

  async function handleDuplicate(id: string) {
    if (!user || duplicatingId) return
    setDuplicatingId(id)
    try {
      const newId = await duplicateDocument(id, user.id)
      toast.success('ทำซ้ำเอกสารเรียบร้อย')
      navigate(`/editor/${newId}`)
    } catch { toast.error('ทำซ้ำเอกสารไม่สำเร็จ') }
    finally { setDuplicatingId(null) }
  }

  async function handleConvert(id: string, toType?: DocTypeCode) {
    if (!user || convertingId) return
    setConvertingId(id)
    try {
      const effectiveType = toType ?? 'invoice'
      const newId = effectiveType === 'invoice'
        ? await convertToInvoice(id, user.id)
        : effectiveType === 'receipt'
          ? await convertToReceipt(id, user.id)
          : await convertToTaxInvoice(id, user.id)
      const label = DOC_TYPE_CODES[effectiveType] ?? effectiveType
      toast.success(`แปลงเป็น${label}เรียบร้อย`)
      navigate(`/editor/${newId}`)
    } catch { toast.error('แปลงเอกสารไม่สำเร็จ') }
    finally { setConvertingId(null) }
  }

  // Conversion options per doc type
  const convertOptions: ConvertOption[] = (() => {
    if (docType === 'quotation')    return [{ label: 'แปลงเป็นใบแจ้งหนี้', toType: 'invoice' }]
    if (docType === 'invoice')      return [
      { label: 'แปลงเป็นใบเสร็จรับเงิน', toType: 'receipt' },
      { label: 'แปลงเป็นใบกำกับภาษี',    toType: 'tax-invoice' },
      { label: 'ออกใบลดหนี้',              toType: 'credit-note' },
    ]
    if (docType === 'receipt')      return [{ label: 'แปลงเป็นใบกำกับภาษี', toType: 'tax-invoice' }]
    if (docType === 'billing-note') return [{ label: 'แปลงเป็นใบแจ้งหนี้', toType: 'invoice' }]
    return []
  })()

  // number of cols for colSpan
  const colCount = isQuotation ? 8 : 6

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {confirmPending && <ConfirmDialog {...confirmPending} onConfirm={onConfirm} onCancel={onCancel} />}
      {paymentDoc && (
        <PaymentModal
          documentId={paymentDoc.id}
          documentTotal={paymentDoc.total}
          documentTitle={paymentDoc.title}
          onClose={() => setPaymentDoc(null)}
          onPaymentChanged={refetch}
        />
      )}
      {emailDoc && (
        <SendEmailModal
          docNumber={emailDoc.doc_number}
          docTypeLabel={DOC_TYPE_CODES[emailDoc.doc_type as DocTypeCode] ?? emailDoc.doc_type}
          customerEmail={emailDoc.customer_email}
          customerName={emailDoc.customer_name}
          onClose={() => setEmailDoc(null)}
        />
      )}
      {upgradeModal && (
        <UpgradeModal
          resource={upgradeModal.resource}
          limit={upgradeModal.limit}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-400">{filtered.length} รายการ</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Excel export */}
          <button
            onClick={() => {
              if (!isBusiness) { toast.error('ฟีเจอร์นี้ต้องการแผน Business'); return }
              if (!user) return
              void exportDocumentsToExcel(user.id, docType, filterDateFrom || undefined, filterDateTo || undefined)
                .then(() => toast.success('Export สำเร็จ'))
                .catch(() => toast.error('Export ไม่สำเร็จ'))
            }}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow ${!isBusiness ? 'opacity-60' : ''}`}
            title={isBusiness ? 'Export Excel' : 'ต้องการแผน Business'}
          >
            {isBusiness ? <FileSpreadsheet size={15} className="text-green-600" /> : <Lock size={15} className="text-slate-400" />}
            Excel
          </button>

          {/* Create */}
          <button
            onClick={() => void handleCreate()}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
            style={{ backgroundColor: themeColor }}
          >
            {creating ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Plus size={16} />}
            {createLabel}
          </button>
        </div>
      </div>

      {/* Summary widgets */}
      {summary.length > 0 && (
        <div className={`mb-4 grid gap-3 ${summary.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : summary.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {summary.map((card) => {
            const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string; iconText: string; valueText: string }> = {
              amber: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', iconText: 'text-amber-600', valueText: 'text-amber-800' },
              green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100', iconText: 'text-green-600', valueText: 'text-green-800' },
              blue:  { border: 'border-blue-200',  bg: 'bg-blue-50',  text: 'text-blue-600',  iconBg: 'bg-blue-100',  iconText: 'text-blue-600',  valueText: 'text-blue-800'  },
              red:   { border: 'border-red-200',   bg: 'bg-red-50',   text: 'text-red-500',   iconBg: 'bg-red-100',   iconText: 'text-red-500',   valueText: 'text-red-700'   },
              slate: { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-500', iconBg: 'bg-slate-100', iconText: 'text-slate-500', valueText: 'text-slate-700' },
            }
            const c = colorMap[card.color] ?? colorMap['slate']
            const IconEl = card.icon === 'hourglass' ? Hourglass
                         : card.icon === 'trending'  ? TrendingUp
                         : card.icon === 'alert'     ? AlertCircle
                         : card.icon === 'xcircle'   ? XCircle
                         : CheckCircle2
            return (
              <div key={card.label} className={`flex items-center gap-3 rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}>
                  <IconEl size={15} className={c.iconText} />
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs ${c.text}`}>{card.label}</p>
                  <p className={`text-sm font-bold ${c.valueText}`}>฿{fmtAmount(card.value)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isQuotation ? 'ค้นหาเลขที่ ชื่อลูกค้า หรือชื่องาน...' : 'ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as DocumentRow['status'] | 'all' | 'overdue'); setPage(1) }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400"
        >
          <option value="all">ทุกสถานะ</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s, docType)}</option>
          ))}
          {docType === 'invoice' && <option value="overdue">เกินกำหนด</option>}
        </select>

        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-400">จากวันที่ (ค.ศ.)</span>
            <input type="date" value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400" />
          </div>
          <span className="mt-4 text-xs text-slate-400">—</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-slate-400">ถึงวันที่ (ค.ศ.)</span>
            <input type="date" value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400" />
          </div>
        </div>

        {(search || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo(''); setPage(1) }}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            ล้างตัวกรอง ✕
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800 px-4 py-2.5">
          <span className="text-sm text-white">เลือก {selectedIds.size} รายการ</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">เปลี่ยนสถานะ:</span>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                disabled={bulkUpdating}
                onClick={() => void handleBulkStatusChange(s)}
                className="text-xs font-medium text-slate-300 hover:text-white disabled:opacity-50"
              >
                {statusLabel(s, docType)}
              </button>
            ))}
            <div className="h-3 w-px bg-slate-600" />
            <button
              disabled={bulkUpdating}
              onClick={() => void handleBulkDelete()}
              className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              ลบที่เลือก
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <TableSkeleton cols={colCount} rows={6} hasCheckbox />
        ) : (
          <>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  <th className="w-12 px-5 py-4">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">วันที่</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">เลขที่เอกสาร</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">ชื่อลูกค้า</th>
                  {isQuotation && <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">ชื่องาน</th>}
                  {isQuotation && <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">พนักงานขาย</th>}
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">ยอดรวม</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">สถานะ</th>
                  <th className="w-12 px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={colCount + 1} className="px-4 py-12 text-center text-sm text-slate-400">{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colCount + 1}>
                      <EmptyState
                        icon={<FilePlus size={22} />}
                        title={rows.length === 0 ? `ยังไม่มี${pageTitle}ในระบบ` : 'ไม่พบเอกสารที่ตรงกับเงื่อนไข'}
                        description={
                          rows.length === 0
                            ? `สร้าง${pageTitle}ฉบับแรก ใช้เวลาไม่กี่วินาที ระบบจำข้อมูลลูกค้าและสินค้าให้`
                            : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'
                        }
                        action={
                          rows.length === 0 ? (
                            <div className="flex flex-col items-center gap-3">
                              <button
                                onClick={() => void handleCreate()}
                                disabled={creating}
                                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                                style={{ backgroundColor: themeColor }}
                              >
                                <Plus size={15} /> {createLabel}
                              </button>
                              <p className="text-xs text-slate-400">
                                สร้างแล้ว Export PDF ได้ทันที · ส่งอีเมลหาลูกค้าได้เลย
                              </p>
                            </div>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : paginated.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/editor/${row.id}`)}
                    className={`cursor-pointer border-b border-slate-100/70 transition-colors last:border-0 ${selectedIds.has(row.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                    </td>
                    <td className="px-5 py-4 text-slate-500">{fmtDate(row.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[13px] font-semibold text-blue-600 hover:underline">{row.doc_number}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">{row.customer_name}</td>
                    {isQuotation && (
                      <td className="px-5 py-4 text-slate-500">{row.project_name || '—'}</td>
                    )}
                    {isQuotation && (
                      <td className="px-5 py-4 text-slate-500">{row.salesperson || '—'}</td>
                    )}
                    <td className="px-5 py-4 text-right font-semibold text-slate-800">฿{fmtAmount(row.total_amount)}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <StatusBadge
                          row={row}
                          docType={docType}
                          updating={updatingStatusId === row.id}
                          onChangeStatus={handleChangeStatus}
                        />
                        {isOverdue(row) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            <AlertCircle size={8} className="shrink-0" />
                            เกินกำหนด
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <KebabMenu
                        row={row}
                        deleting={deletingId === row.id}
                        duplicating={duplicatingId === row.id}
                        converting={convertingId === row.id}
                        onDelete={handleDelete}
                        onNavigate={(id) => navigate(`/editor/${id}`)}
                        onDuplicate={handleDuplicate}
                        onConvert={convertOptions.length > 0 ? handleConvert : undefined}
                        converts={convertOptions.length > 0 ? convertOptions : undefined}
                        onPayment={(id, total, title) => setPaymentDoc({ id, total, title })}
                        onEmail={(r) => {
                          if (!isPro) { navigate('/settings/billing'); return }
                          setEmailDoc(r)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE}
              onPage={p => { setPage(p); setSelectedIds(new Set()) }} />
          </>
        )}
      </div>
    </div>
  )
}
