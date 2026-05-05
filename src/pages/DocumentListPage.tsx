import type { ChangeEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useDocumentsByType } from '../hooks/useDocumentsByType'
import { createDocument, deleteDocument, updateDocumentStatus } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'
import type { DocTypeCode } from '../types/document'
import { DOC_TYPE_CODES } from '../types/document'

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
  draft:     'bg-slate-100 text-slate-500',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

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

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  const pageTitle = DOC_TYPE_CODES[docType]
  const createLabel = DOC_CREATE_LABEL[docType]

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

  async function handleChangeStatus(event: ChangeEvent<HTMLSelectElement>, id: string, status: DocumentRow['status']) {
    event.stopPropagation()
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500">วันที่</th>
              <th className="px-4 py-3 font-semibold text-slate-500">เลขที่เอกสาร</th>
              <th className="px-4 py-3 font-semibold text-slate-500">ชื่อลูกค้า</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">ยอดรวมสุทธิ</th>
              <th className="px-4 py-3 font-semibold text-slate-500">สถานะ</th>
              <th className="w-12 px-4 py-3" />
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <FilePlus size={20} />
                  </div>
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
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/editor/${row.id}`)}
                className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="px-4 py-3 text-slate-500">{fmtDate(row.created_at)}</td>
                <td className="px-4 py-3 font-mono font-medium text-slate-700">{row.doc_number}</td>
                <td className="px-4 py-3 text-slate-700">{row.customer_name}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">{fmtAmount(row.total_amount)}</td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                    <select
                      value={row.status}
                      disabled={updatingStatusId === row.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => void handleChangeStatus(e, row.id, e.target.value as DocumentRow['status'])}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => void handleDelete(e, row.id)}
                    disabled={deletingId === row.id}
                    className="rounded p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    aria-label="ลบเอกสาร"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
