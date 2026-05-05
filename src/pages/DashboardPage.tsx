import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus, FileSearch } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type DashboardDoc = {
  id: string
  no: string
  customer: string
  date: string
  total: number
  status: 'Paid' | 'Pending' | 'Draft'
}

type RawDocument = {
  id: string
  created_at: string | null
  content: unknown
}

function statusBadgeClass(status: string) {
  if (status === 'Paid') return 'bg-emerald-100 text-emerald-700 ring-emerald-200'
  if (status === 'Pending') return 'bg-amber-100 text-amber-700 ring-amber-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatCurrency(value: number): string {
  return `฿ ${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function mapStatus(value: unknown): 'Paid' | 'Pending' | 'Draft' {
  if (typeof value !== 'string') return 'Draft'
  const lowered = value.toLowerCase()
  if (lowered === 'paid') return 'Paid'
  if (lowered === 'pending' || lowered === 'unpaid') return 'Pending'
  return 'Draft'
}

function mapDocument(row: RawDocument, index: number): DashboardDoc {
  const content = isRecord(row.content) ? row.content : {}
  const customer = isRecord(content.customer) ? content.customer : {}
  const meta = isRecord(content.docMeta) ? content.docMeta : {}
  const summary = isRecord(content.summary) ? content.summary : {}

  const date = row.created_at ? new Date(row.created_at).toLocaleDateString('th-TH') : '-'
  const no = typeof meta.docNo === 'string' && meta.docNo.trim()
    ? meta.docNo
    : `DOC-${String(index + 1).padStart(4, '0')}`
  const customerName = typeof customer.name === 'string' && customer.name.trim() ? customer.name : 'ลูกค้าทั่วไป'
  const total = toNumber(summary.grandTotal)
  const status = mapStatus(meta.status)

  return { id: row.id, no, customer: customerName, date, total, status }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DashboardDoc[]>([])
  const [docCount, setDocCount] = useState(0)
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('documents')
        .select('id, created_at, content', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(8)

      if (!active) return

      if (error) {
        setDocuments([])
        setDocCount(0)
        toast.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
        setLoading(false)
        return
      }

      const rows: RawDocument[] = Array.isArray(data)
        ? data.filter((item): item is RawDocument => isRecord(item) && typeof item.id === 'string')
        : []

      setDocuments(rows.map(mapDocument))
      setDocCount(typeof count === 'number' ? count : rows.length)
      setLoading(false)
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    const totalSales = documents.reduce((acc, item) => acc + item.total, 0)
    const pendingDocs = documents.filter((item) => item.status === 'Pending')
    const pendingAmount = pendingDocs.reduce((acc, item) => acc + item.total, 0)
    return {
      totalSales,
      pendingCount: pendingDocs.length,
      pendingAmount,
    }
  }, [documents])

  const openCreateDoc = () => {
    toast.success('พร้อมสร้างเอกสารใหม่แล้ว')
    navigate('/editor/new')
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
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(summary.totalSales)}</p>
              <p className="mt-2 text-xs text-slate-400">จากเอกสารล่าสุด {documents.length} รายการ</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">ใบแจ้งหนี้รอเก็บเงิน</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.pendingCount} ใบ</p>
              <p className="mt-2 text-xs text-slate-400">ต้องติดตามการชำระเงิน</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">ยอดค้างชำระ</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(summary.pendingAmount)}</p>
              <p className="mt-2 text-xs text-slate-400">เฉพาะเอกสารสถานะ Pending</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={openCreateDoc}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: themeColor }}>
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
                <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800">เอกสารทั้งหมด</p>
                <p className="mt-0.5 text-xs text-slate-500">ดูและจัดการเอกสารที่บันทึกไว้</p>
              </div>
            </button>
          </div>

          {docCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FilePlus size={28} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">ยังไม่มีเอกสารใบแรก</h2>
              <p className="mt-1 text-sm text-slate-500">เริ่มสร้างเอกสารของคุณได้ที่นี่</p>
              <button
                onClick={openCreateDoc}
                className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
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
                      <th className="px-5 py-3 font-medium">เลขที่</th>
                      <th className="px-5 py-3 font-medium">ลูกค้า</th>
                      <th className="px-5 py-3 font-medium">วันที่</th>
                      <th className="px-5 py-3 text-right font-medium">ยอดรวม</th>
                      <th className="px-5 py-3 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-5 py-3 font-medium">{row.no}</td>
                        <td className="px-5 py-3">{row.customer}</td>
                        <td className="px-5 py-3">{row.date}</td>
                        <td className="px-5 py-3 text-right font-medium">{formatCurrency(row.total)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
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
