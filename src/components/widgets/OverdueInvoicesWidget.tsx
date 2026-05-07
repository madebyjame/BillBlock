import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import type { DashboardData, DashboardDoc } from '../../types/dashboard'

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getCustomerName(content: unknown): string {
  if (content !== null && typeof content === 'object' && 'customer' in content) {
    const c = (content as { customer?: { name?: unknown } }).customer
    if (c && typeof c.name === 'string' && c.name.trim()) return c.name
  }
  return 'ไม่ระบุชื่อ'
}

interface Props {
  data: Pick<DashboardData, 'pendingAmount' | 'pendingCount' | 'pendingDocs' | 'loading'>
}

export default function OverdueInvoicesWidget({ data }: Props) {
  const navigate = useNavigate()

  const preview = data.pendingDocs.slice(0, 3)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${data.pendingCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
            <AlertTriangle size={13} className={data.pendingCount > 0 ? 'text-red-500' : 'text-slate-400'} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ค้างชำระ</p>
        </div>
        <button
          onClick={() => navigate('/documents/invoices')}
          className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ดูทั้งหมด <ChevronRight size={13} />
        </button>
      </div>

      {data.loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : data.pendingCount === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
            <AlertTriangle size={18} className="text-green-400" />
          </div>
          <p className="text-sm font-medium text-slate-500">ไม่มียอดค้างชำระ</p>
          <p className="mt-0.5 text-xs text-slate-400">เก็บเงินครบทุกใบแล้ว!</p>
        </div>
      ) : (
        <>
          {/* Total banner */}
          <div className="mb-3 rounded-xl bg-red-50 p-3">
            <p className="text-xs text-red-400">ยอดรวมค้างชำระ</p>
            <p className="text-xl font-bold text-red-600">฿{fmtAmount(data.pendingAmount)}</p>
            <p className="text-xs text-red-400">{data.pendingCount} ใบ</p>
          </div>

          {/* Invoice list */}
          <div className="flex flex-col gap-1.5">
            {preview.map((doc: DashboardDoc) => (
              <button
                key={doc.id}
                onClick={() => navigate(`/editor/${doc.id}`)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 border border-slate-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{getCustomerName(doc.content)}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-xs font-semibold text-red-500">
                  ฿{fmtAmount(doc.total_amount)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
