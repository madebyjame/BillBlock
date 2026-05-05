import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, FileSearch } from 'lucide-react'
import { toast } from 'sonner'
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
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  async function handleCreate() {
    if (!user || creating) return
    setCreating(true)
    try {
      const id = await createDocument(user.id)
      navigate(`/editor/${id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'สร้างเอกสารไม่สำเร็จ'
      toast.error(msg)
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">ยินดีต้อนรับ, {user?.email}</p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">ยอดรวมยอดขาย</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">฿ {fmtAmount(stats.totalAmount)}</p>
              <p className="mt-2 text-xs text-slate-400">ยอดรวมจากเอกสารทั้งหมด</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">เอกสารทั้งหมด</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stats.total} รายการ</p>
              <p className="mt-2 text-xs text-slate-400">รวมทุกรายการในระบบ</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">เอกสารเดือนนี้</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stats.thisMonth} รายการ</p>
              <p className="mt-2 text-xs text-slate-400">สร้างภายในเดือนปัจจุบัน</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: themeColor }}>
                <FilePlus size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">สร้างเอกสารใหม่</p>
                <p className="mt-0.5 text-xs text-slate-500">ใบเสนอราคา, ใบแจ้งหนี้ และอื่นๆ</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <FileSearch size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">เอกสารทั้งหมด</p>
                <p className="mt-0.5 text-xs text-slate-500">ดูและจัดการเอกสารที่บันทึกไว้</p>
              </div>
            </button>
          </div>

          {recentRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FilePlus size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">ยังไม่มีเอกสารใบแรก</h2>
              <p className="mt-1 text-sm text-slate-500">เริ่มสร้างเอกสารของคุณได้ที่นี่</p>
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: themeColor }}
              >
                <FileSearch size={16} />
                สร้างเอกสารใหม่
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-700">เอกสารล่าสุด</p>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  ดูทั้งหมด
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-500">
                      <th className="px-5 py-3 font-medium">ประเภท</th>
                      <th className="px-5 py-3 font-medium">วันที่สร้าง</th>
                      <th className="px-5 py-3 font-medium">แก้ไขล่าสุด</th>
                      <th className="px-5 py-3 text-right font-medium">ยอดรวม</th>
                      <th className="px-5 py-3 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-5 py-3 font-medium">{DOC_TYPE_LABEL[row.doc_type] ?? row.doc_type}</td>
                        <td className="px-5 py-3">{fmtDate(row.created_at)}</td>
                        <td className="px-5 py-3">{fmtDate(row.updated_at)}</td>
                        <td className="px-5 py-3 text-right font-medium">฿ {fmtAmount(row.total_amount)}</td>
                        <td className="px-5 py-3 text-slate-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-36 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-32 rounded bg-slate-200" />
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="mb-3 h-10 rounded bg-slate-100 last:mb-0" />
        ))}
      </div>
    </div>
  )
}
