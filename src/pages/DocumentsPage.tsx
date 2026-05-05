import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type DocRow = {
  id: string
  no: string
  type: string
  customer: string
  date: string
  total: string
}

type RawDocument = {
  id: string
  created_at: string | null
  content: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function mapDocumentRow(item: RawDocument, index: number): DocRow {
  const content = isRecord(item.content) ? item.content : {}
  const meta = isRecord(content.docMeta) ? content.docMeta : {}
  const customer = isRecord(content.customer) ? content.customer : {}
  const summary = isRecord(content.summary) ? content.summary : {}

  const no = typeof meta.docNo === 'string' && meta.docNo.trim()
    ? meta.docNo
    : `DOC-${String(index + 1).padStart(4, '0')}`
  const type = typeof meta.docType === 'string' && meta.docType.trim() ? meta.docType : 'เอกสาร'
  const customerName = typeof customer.name === 'string' && customer.name.trim() ? customer.name : 'ลูกค้าทั่วไป'
  const totalNumber = typeof summary.grandTotal === 'number' && Number.isFinite(summary.grandTotal) ? summary.grandTotal : 0
  const total = `฿ ${totalNumber.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const date = item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-'

  return { id: item.id, no, type, customer: customerName, date, total }
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<DocRow[]>([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadDocuments() {
      setLoading(true)
      const { data, error, count: totalCount } = await supabase
        .from('documents')
        .select('id, created_at, content', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (!active) return

      if (error) {
        toast.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
        setRows([])
        setCount(0)
        setLoading(false)
        return
      }

      const mappedRows = Array.isArray(data)
        ? data
            .filter((item): item is RawDocument => isRecord(item) && typeof item.id === 'string')
            .map(mapDocumentRow)
        : []

      setRows(mappedRows)
      setCount(typeof totalCount === 'number' ? totalCount : mappedRows.length)
      setLoading(false)
    }

    void loadDocuments()
    return () => {
      active = false
    }
  }, [])

  function handleCreate() {
    toast.success('พร้อมสร้างเอกสารใหม่แล้ว')
    navigate('/editor/new')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">เอกสารทั้งหมด</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: themeColor }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างใหม่
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="mb-3 h-10 rounded bg-slate-100 last:mb-0" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FilePlus size={28} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">ยังไม่มีเอกสารใบแรก</h2>
          <p className="mt-1 text-sm text-slate-500">เริ่มสร้างเอกสารของคุณได้ที่นี่</p>
          <button
            onClick={handleCreate}
            className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            <FilePlus size={16} />
            สร้างเอกสารใหม่
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-500">เลขที่</th>
                <th className="px-4 py-3 font-semibold text-slate-500">ประเภท</th>
                <th className="px-4 py-3 font-semibold text-slate-500">ลูกค้า</th>
                <th className="px-4 py-3 font-semibold text-slate-500">วันที่</th>
                <th className="px-4 py-3 font-semibold text-slate-500 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{row.no}</td>
                  <td className="px-4 py-3 text-slate-600">{row.type}</td>
                  <td className="px-4 py-3 text-slate-600">{row.customer}</td>
                  <td className="px-4 py-3 text-slate-500">{row.date}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
