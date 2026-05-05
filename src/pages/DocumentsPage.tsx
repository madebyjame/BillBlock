import type { ChangeEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../hooks/useDocuments'
import { createDocument, deleteDocument, updateDocumentStatus } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'
import type { DocTypeCode } from '../types/document'

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: 'ใบแจ้งหนี้',
  quotation: 'ใบเสนอราคา',
  receipt: 'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice': 'ใบกำกับภาษี',
}

// ─── New Document Modal ───────────────────────────────────────────────────────
function NewDocModal({ onSelect, onClose }: {
  onSelect: (type: DocTypeCode) => void
  onClose: () => void
}) {
  const options: { type: DocTypeCode; label: string; prefix: string; desc: string; icon: string }[] = [
    { type: 'quotation', label: 'ใบเสนอราคา', prefix: 'QT-', desc: 'เสนอราคาสินค้าหรือบริการให้ลูกค้า', icon: '📋' },
    { type: 'invoice',   label: 'ใบแจ้งหนี้',  prefix: 'INV-', desc: 'แจ้งหนี้สำหรับสินค้าหรือบริการที่ส่งมอบแล้ว', icon: '🧾' },
    { type: 'receipt',   label: 'ใบเสร็จรับเงิน', prefix: 'REC-', desc: 'ยืนยันการรับชำระเงิน', icon: '✅' },
    { type: 'billing-note', label: 'ใบวางบิล', prefix: 'BN-', desc: 'วางบิลเรียกเก็บเงินจากลูกค้า', icon: '📑' },
    { type: 'tax-invoice',  label: 'ใบกำกับภาษี', prefix: 'TAX-', desc: 'เอกสารภาษีมูลค่าเพิ่ม 7%', icon: '🏛️' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-[480px] rounded-2xl bg-white shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800">สร้างเอกสารใหม่</h2>
          <p className="text-sm text-slate-400 mt-0.5">เลือกประเภทเอกสาร — ไม่สามารถเปลี่ยนได้ภายหลัง</p>
        </div>
        <div className="space-y-2">
          {options.map(opt => (
            <button key={opt.type} onClick={() => onSelect(opt.type)}
              className="w-full flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors group">
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{opt.label}</span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{opt.prefix}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
              <svg className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<DocumentRow['status'], string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const STATUS_CLASS: Record<DocumentRow['status'], string> = {
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { rows, loading, error, refetch } = useDocuments()
  const [showNewModal, setShowNewModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  async function handleCreate(docType: DocTypeCode) {
    if (!user || creating) return
    setShowNewModal(false)
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
      {showNewModal && (
        <NewDocModal
          onSelect={(type) => void handleCreate(type)}
          onClose={() => setShowNewModal(false)}
        />
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">เอกสารทั้งหมด</h1>
        <button
          onClick={() => setShowNewModal(true)}
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
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          สร้างใหม่
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-slate-500">สถานะ</th>
              <th className="px-4 py-3 font-semibold text-slate-500">วันที่สร้าง</th>
              <th className="px-4 py-3 font-semibold text-slate-500">แก้ไขล่าสุด</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500">ยอดรวม</th>
              <th className="w-16 px-4 py-3" />
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
                  <p className="font-medium text-slate-600">เริ่มสร้างเอกสารใบแรกของคุณเลย!</p>
                  <p className="mt-1 text-xs">ยังไม่มีข้อมูลเอกสารในระบบตอนนี้</p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    disabled={creating}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: themeColor }}
                  >
                    <FilePlus size={14} />
                    สร้างเอกสารใหม่
                  </button>
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/editor/${row.id}`)}
                className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-slate-700">{DOC_TYPE_LABEL[row.doc_type] ?? row.doc_type}</td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                    <select
                      value={row.status}
                      disabled={updatingStatusId === row.id}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => void handleChangeStatus(event, row.id, event.target.value as DocumentRow['status'])}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(row.created_at)}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(row.updated_at)}</td>
                <td className="px-4 py-3 text-right text-slate-700">{fmtAmount(row.total_amount)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(event) => void handleDelete(event, row.id)}
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
