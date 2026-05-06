import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, Plus, Search, ChevronDown, MoreVertical, Eye, Pencil, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useDocumentsByType } from '../hooks/useDocumentsByType'
import { createDocument, deleteDocument, updateDocumentStatus } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'
import type { DocTypeCode } from '../types/document'
import { DOC_TYPE_CODES } from '../types/document'
import type { DocListRow } from '../hooks/useDocumentsByType'

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_CREATE_LABEL: Record<DocTypeCode, string> = {
  quotation:      'สร้างใบเสนอราคา',
  invoice:        'สร้างใบแจ้งหนี้',
  receipt:        'สร้างใบเสร็จรับเงิน',
  'billing-note': 'สร้างใบวางบิล',
  'tax-invoice':  'สร้างใบกำกับภาษี',
}

const STATUS_LABEL: Record<DocumentRow['status'], string> = {
  draft:     'ฉบับร่าง',
  sent:      'ส่งแล้ว',
  paid:      'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const STATUS_CLASS: Record<DocumentRow['status'], string> = {
  draft:     'bg-slate-200 text-slate-700',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

const ALL_STATUSES = ['draft', 'sent', 'paid', 'cancelled'] as const

const PAGE_SIZE = 10

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Clickable Status Badge ───────────────────────────────────────────────────

function StatusBadge({
  row,
  updating,
  onChangeStatus,
}: {
  row: DocListRow
  updating: boolean
  onChangeStatus: (id: string, status: DocumentRow['status']) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={updating}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50 ${STATUS_CLASS[row.status]}`}
      >
        {STATUS_LABEL[row.status]}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
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
              <span className={`h-1.5 w-1.5 rounded-full ${s === 'draft' ? 'bg-slate-400' : s === 'sent' ? 'bg-blue-400' : s === 'paid' ? 'bg-green-400' : 'bg-red-400'}`} />
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Kebab Menu ───────────────────────────────────────────────────────────────

function KebabMenu({
  row,
  deleting,
  onDelete,
  onNavigate,
}: {
  row: DocListRow
  deleting: boolean
  onDelete: (e: MouseEvent<HTMLButtonElement>, id: string) => void
  onNavigate: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        disabled={deleting}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
        aria-label="เมนู"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Eye size={13} className="text-slate-400" />
            ดูรายละเอียด
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil size={13} className="text-slate-400" />
            แก้ไข
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download size={13} className="text-slate-400" />
            ดาวน์โหลด PDF
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={(e) => { setOpen(false); onDelete(e, row.id) }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={13} />
            ลบเอกสาร
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-400">{total} รายการ</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
        >
          ‹ ก่อนหน้า
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-300">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`min-w-7 rounded-lg px-2 py-1 text-xs transition-colors ${p === page ? 'bg-slate-800 font-semibold text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
        >
          ถัดไป ›
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  docType: DocTypeCode
}

export default function DocumentListPage({ docType }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { rows, loading, error, refetch } = useDocumentsByType(docType)

  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DocumentRow['status'] | 'all'>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Pagination
  const [page, setPage] = useState(1)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  const pageTitle = DOC_TYPE_CODES[docType]
  const createLabel = DOC_CREATE_LABEL[docType]

  // Reset page when filter changes
  useEffect(() => { setPage(1) }, [search, filterStatus, filterDateFrom, filterDateTo])

  // Filtered rows (frontend — TODO: move to backend query params when API supports it)
  const filtered = rows.filter((row) => {
    if (search) {
      const q = search.toLowerCase()
      if (!row.doc_number.toLowerCase().includes(q) && !row.customer_name.toLowerCase().includes(q)) return false
    }
    if (filterStatus !== 'all' && row.status !== filterStatus) return false
    if (filterDateFrom && row.created_at < filterDateFrom) return false
    if (filterDateTo && row.created_at > filterDateTo + 'T23:59:59') return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate() {
    if (!user || creating) return
    setCreating(true)
    try {
      const id = await createDocument(user.id, docType)
      navigate(`/editor/${id}`)
    } catch {
      toast.error('สร้างเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      setCreating(false)
    }
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation()
    if (!confirm('ลบเอกสารนี้?')) return
    setDeletingId(id)
    try {
      await deleteDocument(id)
      refetch()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleChangeStatus(id: string, status: DocumentRow['status']) {
    setUpdatingStatusId(id)
    try {
      await updateDocumentStatus(id, status)
      toast.success('อัปเดตสถานะเอกสารแล้ว')
      refetch()
    } catch {
      toast.error('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
        <button
          onClick={() => void handleCreate()}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: themeColor }}
        >
          {creating ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Plus size={16} />
          )}
          {createLabel}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DocumentRow['status'] | 'all')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400"
        >
          <option value="all">ทุกสถานะ</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400"
          />
          <span className="text-xs text-slate-400">ถึง</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-slate-400"
          />
        </div>

        {(search || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo('') }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ล้างตัวกรอง ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500">วันที่</th>
              <th className="px-4 py-3 font-semibold text-slate-500">เลขที่เอกสาร</th>
              <th className="px-4 py-3 font-semibold text-slate-500">ชื่อลูกค้า</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">ยอดรวมสุทธิ</th>
              <th className="px-4 py-3 font-semibold text-slate-500">สถานะ</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <svg className="mx-auto mb-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังโหลด...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">{error}</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <FilePlus size={20} />
                  </div>
                  {rows.length === 0 ? (
                    <>
                      <p className="font-medium text-slate-600">ยังไม่มี{pageTitle}ในระบบ</p>
                      <p className="mt-1 text-xs">คลิกปุ่มด้านบนเพื่อเริ่มสร้างเอกสาร</p>
                      <button
                        onClick={() => void handleCreate()}
                        disabled={creating}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Plus size={14} />
                        {createLabel}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-slate-600">ไม่พบเอกสารที่ตรงกับเงื่อนไข</p>
                      <p className="mt-1 text-xs">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
                    </>
                  )}
                </td>
              </tr>
            ) : paginated.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/editor/${row.id}`)}
                className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="px-4 py-3 text-slate-500">{fmtDate(row.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="font-mono font-medium text-blue-600 hover:underline">
                    {row.doc_number}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.customer_name}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtAmount(row.total_amount)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    row={row}
                    updating={updatingStatusId === row.id}
                    onChangeStatus={handleChangeStatus}
                  />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <KebabMenu
                    row={row}
                    deleting={deletingId === row.id}
                    onDelete={handleDelete}
                    onNavigate={(id) => navigate(`/editor/${id}`)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          onPage={setPage}
        />
      </div>
    </div>
  )
}
