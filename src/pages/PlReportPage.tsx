import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, FileSpreadsheet, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getExpenseSummary } from '../lib/expenseApi'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlRow {
  month_key: string
  revenue: number
  cogs: number
  gross_profit: number
  expenses: number
  net_profit: number
  doc_count: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return '—'
  return (numerator / denominator * 100).toFixed(1) + '%'
}

function currentYear() {
  return new Date().getFullYear()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlReportPage() {
  const { user } = useAuth()
  const [rows, setRows]         = useState<PlRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [year, setYear] = useState(currentYear)
  const availableYears = [currentYear(), currentYear() - 1, currentYear() - 2]

  const dateFrom = `${year}-01-01`
  const dateTo   = `${year}-12-31`

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  async function loadData() {
    if (!user) return
    setLoading(true)
    try {
      const [{ data, error }, expenseData] = await Promise.all([
        supabase.rpc('get_pl_summary', { p_date_from: dateFrom, p_date_to: dateTo }),
        getExpenseSummary(dateFrom, dateTo),
      ])
      if (error) throw error

      // Build expense map by month_key
      const expMap = new Map(expenseData.map(e => [e.month_key, e.total_expenses]))

      setRows((data ?? []).map((r: Record<string, unknown>) => {
        const grossProfit = Number(r.gross_profit)
        const expenses    = expMap.get(String(r.month_key)) ?? 0
        return {
          month_key:    String(r.month_key),
          revenue:      Number(r.revenue),
          cogs:         Number(r.cogs),
          gross_profit: grossProfit,
          expenses,
          net_profit:   grossProfit - expenses,
          doc_count:    Number(r.doc_count),
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  // Recalculate COGS for all paid docs in the period
  async function handleRefreshCogs() {
    if (!user) return
    setRefreshing(true)
    try {
      const { data: paidDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .in('doc_type', ['invoice', 'receipt', 'tax-invoice'])
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')

      if (paidDocs && paidDocs.length > 0) {
        await Promise.all(
          paidDocs.map(d =>
            supabase.rpc('refresh_doc_cogs', { p_doc_id: d.id })
              .then(() => undefined, () => undefined),
          ),
        )
      }
      await loadData()
      toast.success('รีเฟรช COGS สำเร็จ')
    } catch {
      toast.error('รีเฟรชไม่สำเร็จ')
    } finally {
      setRefreshing(false)
    }
  }

  const totals = useMemo(() => ({
    revenue:      rows.reduce((s, r) => s + r.revenue, 0),
    cogs:         rows.reduce((s, r) => s + r.cogs, 0),
    gross_profit: rows.reduce((s, r) => s + r.gross_profit, 0),
    expenses:     rows.reduce((s, r) => s + r.expenses, 0),
    net_profit:   rows.reduce((s, r) => s + r.net_profit, 0),
    doc_count:    rows.reduce((s, r) => s + r.doc_count, 0),
  }), [rows])

  function exportExcel() {
    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }

    const exportRows = [
      ...rows.map(r => ({
        เดือน: monthLabel(r.month_key),
        'รายได้ (฿)': r.revenue,
        'COGS (฿)': r.cogs,
        'กำไรขั้นต้น (฿)': r.gross_profit,
        'Gross Margin (%)': pct(r.gross_profit, r.revenue),
        'ค่าใช้จ่าย (฿)': r.expenses,
        'กำไรสุทธิ (฿)': r.net_profit,
        'Net Margin (%)': pct(r.net_profit, r.revenue),
        จำนวนเอกสาร: r.doc_count,
      })),
      {
        เดือน: `รวมทั้งปี ${year}`,
        'รายได้ (฿)': totals.revenue,
        'COGS (฿)': totals.cogs,
        'กำไรขั้นต้น (฿)': totals.gross_profit,
        'Gross Margin (%)': pct(totals.gross_profit, totals.revenue),
        'ค่าใช้จ่าย (฿)': totals.expenses,
        'กำไรสุทธิ (฿)': totals.net_profit,
        'Net Margin (%)': pct(totals.net_profit, totals.revenue),
        จำนวนเอกสาร: totals.doc_count,
      },
    ]

    const ws = XLSX.utils.json_to_sheet(exportRows)
    ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `P&L ${year}`)
    XLSX.writeFile(wb, `pl_report_${year}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">กำไร & ขาดทุน (P&L)</h1>
          <p className="mt-1.5 text-sm text-slate-400">รายได้ − COGS − ค่าใช้จ่าย = กำไรสุทธิ จากเอกสารที่ชำระแล้ว</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleRefreshCogs()}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
            title="คำนวณ COGS ใหม่ทั้งหมดสำหรับปีนี้"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            รีเฟรช COGS
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50"
          >
            <FileSpreadsheet size={15} className="text-green-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Year selector */}
      <div className="mb-6 flex items-center gap-2">
        {availableYears.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              year === y
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Summary KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: `รายได้รวม ${year}`,
            value: totals.revenue,
            color: 'text-green-700',
            bg: 'bg-green-50 border-green-100',
            Icon: TrendingUp,
            iconColor: 'text-green-500',
          },
          {
            label: 'COGS รวม',
            value: totals.cogs,
            color: 'text-slate-700',
            bg: 'bg-white border-slate-200',
            Icon: TrendingDown,
            iconColor: 'text-slate-400',
          },
          {
            label: 'กำไรขั้นต้น',
            value: totals.gross_profit,
            color: totals.gross_profit >= 0 ? 'text-blue-700' : 'text-red-600',
            bg: totals.gross_profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100',
            Icon: TrendingUp,
            iconColor: totals.gross_profit >= 0 ? 'text-blue-500' : 'text-red-400',
          },
          {
            label: 'ค่าใช้จ่าย',
            value: totals.expenses,
            color: 'text-red-600',
            bg: 'bg-red-50 border-red-100',
            Icon: Wallet,
            iconColor: 'text-red-400',
          },
          {
            label: 'กำไรสุทธิ',
            value: totals.net_profit,
            color: totals.net_profit >= 0 ? 'text-emerald-700' : 'text-red-600',
            bg: totals.net_profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100',
            Icon: TrendingUp,
            iconColor: totals.net_profit >= 0 ? 'text-emerald-500' : 'text-red-400',
          },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.Icon size={15} className={card.iconColor} />
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              ฿{fmtAmount(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <TrendingUp size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ไม่พบเอกสารที่ชำระแล้วในปี {year}</p>
          <p className="mt-1 text-xs text-slate-300">เปลี่ยนสถานะเอกสารเป็น "ชำระแล้ว" เพื่อให้ปรากฏในรายงานนี้</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                {['เดือน', 'รายได้', 'COGS', 'กำไรขั้นต้น', 'Gross Margin', 'ค่าใช้จ่าย', 'กำไรสุทธิ', 'Net Margin'].map(h => (
                  <th key={h} className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${h !== 'เดือน' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const grossMargin = row.revenue > 0 ? (row.gross_profit / row.revenue * 100) : 0
                const netMargin   = row.revenue > 0 ? (row.net_profit / row.revenue * 100) : 0
                const isNetLoss   = row.net_profit < 0
                return (
                  <tr key={row.month_key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-4 font-medium text-slate-700">{monthLabel(row.month_key)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-green-700">฿{fmtAmount(row.revenue)}</td>
                    <td className="px-4 py-4 text-right text-slate-500">
                      {row.cogs > 0 ? `฿${fmtAmount(row.cogs)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-4 text-right font-semibold ${row.gross_profit < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                      ฿{fmtAmount(row.gross_profit)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        grossMargin >= 30 ? 'bg-green-100 text-green-700'
                        : grossMargin >= 10 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                      }`}>
                        {pct(row.gross_profit, row.revenue)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-red-600">
                      {row.expenses > 0 ? `฿${fmtAmount(row.expenses)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${isNetLoss ? 'text-red-600' : 'text-emerald-700'}`}>
                      ฿{fmtAmount(row.net_profit)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        netMargin >= 20 ? 'bg-emerald-100 text-emerald-700'
                        : netMargin >= 5 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                      }`}>
                        {pct(row.net_profit, row.revenue)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Grand total */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-4 py-4 font-bold text-slate-700">รวมทั้งปี {year}</td>
                <td className="px-4 py-4 text-right font-bold text-green-700">฿{fmtAmount(totals.revenue)}</td>
                <td className="px-4 py-4 text-right font-bold text-slate-600">฿{fmtAmount(totals.cogs)}</td>
                <td className="px-4 py-4 text-right font-bold text-blue-700">฿{fmtAmount(totals.gross_profit)}</td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-bold text-slate-600">{pct(totals.gross_profit, totals.revenue)}</span>
                </td>
                <td className="px-4 py-4 text-right font-bold text-red-600">฿{fmtAmount(totals.expenses)}</td>
                <td className={`px-4 py-4 text-right text-lg font-bold ${totals.net_profit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  ฿{fmtAmount(totals.net_profit)}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-bold text-slate-600">{pct(totals.net_profit, totals.revenue)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
