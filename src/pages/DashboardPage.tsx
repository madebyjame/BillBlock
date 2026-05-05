import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDocuments } from '../hooks/useDocuments'
import { createDocument } from '../lib/documentApi'

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: 'ใบแจ้งหนี้',
  quotation: 'ใบเสนอราคา',
  receipt: 'ใบเสร็จรับเงิน',
  'tax-invoice': 'ใบกำกับภาษี',
  'delivery-note': 'ใบส่งของ',
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { recentRows, loading, stats } = useDocuments()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreate() {
    if (!user || creating) return
    setCreating(true)
    setCreateError('')
    try {
      const id = await createDocument(user.id)
      navigate(`/editor/${id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'สร้างเอกสารไม่สำเร็จ')
      setCreating(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">ยินดีต้อนรับ, {user?.email}</p>
      </div>

      {/* Quick actions */}
      {createError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">สร้างเอกสารไม่สำเร็จ:</span> {createError}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => void handleCreate()}
          disabled={creating}
          className="flex items-center gap-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-left hover:border-blue-400 hover:bg-blue-100 transition-colors disabled:opacity-60"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-700">
            {creating ? (
              <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800">สร้างเอกสารใหม่</p>
            <p className="text-xs text-slate-500 mt-0.5">ใบเสนอราคา, ใบแจ้งหนี้ และอื่นๆ</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">เอกสารทั้งหมด</p>
            <p className="text-xs text-slate-500 mt-0.5">ดูและจัดการเอกสารที่บันทึกไว้</p>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <p className="text-sm font-semibold text-slate-600 mb-4">ภาพรวม</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-800">{loading ? '…' : stats.total}</p>
            <p className="text-xs text-slate-400 mt-1">เอกสารทั้งหมด</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-800">{loading ? '…' : stats.thisMonth}</p>
            <p className="text-xs text-slate-400 mt-1">เดือนนี้</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-800">{loading ? '…' : fmtAmount(stats.totalAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">ยอดรวมทั้งหมด (฿)</p>
          </div>
        </div>
      </div>

      {/* Recent docs */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">เอกสารล่าสุด</p>
          {!loading && recentRows.length > 0 && (
            <button onClick={() => navigate('/documents')} className="text-xs text-blue-600 hover:underline">ดูทั้งหมด</button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">กำลังโหลด…</div>
        ) : recentRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="h-10 w-10 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-slate-500">ยังไม่มีเอกสาร</p>
            <p className="text-xs mt-1">กดปุ่ม "สร้างเอกสารใหม่" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-slate-500">ประเภท</th>
                <th className="px-4 py-2.5 font-semibold text-slate-500">วันที่</th>
                <th className="px-4 py-2.5 font-semibold text-slate-500 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map(r => (
                <tr key={r.id} onClick={() => navigate(`/editor/${r.id}`)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-slate-700 font-medium">{DOC_TYPE_LABEL[r.doc_type] ?? r.doc_type}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700 text-right">{fmtAmount(r.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
