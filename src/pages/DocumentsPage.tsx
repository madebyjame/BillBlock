import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../hooks/useDocuments'
import { createDocument, deleteDocument } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: 'ใบแจ้งหนี้',
  quotation: 'ใบเสนอราคา',
  receipt: 'ใบเสร็จรับเงิน',
  'tax-invoice': 'ใบกำกับภาษี',
  'delivery-note': 'ใบส่งของ',
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
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!user || creating) return
    setCreating(true)
    try {
      const id = await createDocument(user.id)
      navigate(`/editor/${id}`)
    } catch {
      setCreating(false)
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('ลบเอกสารนี้?')) return
    setDeletingId(id)
    try {
      await deleteDocument(id)
      refetch()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">เอกสารทั้งหมด</h1>
        <button
          onClick={() => void handleCreate()}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
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

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-slate-500">สถานะ</th>
              <th className="px-4 py-3 font-semibold text-slate-500">วันที่สร้าง</th>
              <th className="px-4 py-3 font-semibold text-slate-500">แก้ไขล่าสุด</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-right">ยอดรวม</th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <svg className="h-5 w-5 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังโหลด…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-red-400 text-sm">{error}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <svg className="h-10 w-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium text-slate-500">ยังไม่มีเอกสาร</p>
                  <p className="text-xs mt-1">กดปุ่ม "สร้างใหม่" เพื่อเริ่มต้น</p>
                </td>
              </tr>
            ) : rows.map(r => (
              <tr key={r.id}
                onClick={() => navigate(`/editor/${r.id}`)}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{DOC_TYPE_LABEL[r.doc_type] ?? r.doc_type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(r.updated_at)}</td>
                <td className="px-4 py-3 text-slate-700 text-right">{fmtAmount(r.total_amount)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => void handleDelete(e, r.id)}
                    disabled={deletingId === r.id}
                    className="rounded p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
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
