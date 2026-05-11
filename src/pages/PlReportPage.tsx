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

type NumVariant = 'revenue' | 'expense' | 'gross' | 'net' | 'cogs'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Month label in Thai with CE year — e.g. "พฤษภาคม 2026" */
function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const monthName = new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('th-TH', { month: 'long' })
  return `${monthName} ${y}`
}

/** Short month abbreviation for chart axis */
function monthShort(key: string) {
  const [, m] = key.split('-')
  return new Date(2000, Number(m) - 1, 1)
    .toLocaleDateString('th-TH', { month: 'short' })
    .replace('.', '')
}

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return '—'
  return (numerator / denominator * 100).toFixed(1) + '%'
}

function currentYear() {
  return new Date().getFullYear()
}

/**
 * Smart number color:
 * - 0 → gray (no visual noise)
 * - revenue → green when > 0
 * - expense → red when > 0
 * - gross/net → green when positive, red when negative
 * - cogs → neutral slate
 */
function numCls(value: number, variant: NumVariant): string {
  if (value === 0) return 'text-gray-400'
  switch (variant) {
    case 'revenue': return 'text-green-600'
    case 'expense': return 'text-red-600'
    case 'cogs':    return 'text-slate-600'
    case 'gross':   return value > 0 ? 'text-blue-700' : 'text-red-600'
    case 'net':     return value > 0 ? 'text-emerald-700' : 'text-red-600'
  }
}

function cardBg(value: number, variant: NumVariant): string {
  if (value === 0) return 'bg-white border-slate-200'
  switch (variant) {
    case 'revenue': return 'bg-green-50 border-green-100'
    case 'expense': return 'bg-red-50 border-red-100'
    case 'cogs':    return 'bg-slate-50 border-slate-200'
    case 'gross':   return value > 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'
    case 'net':     return value > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
  }
}

function cardIconCls(value: number, variant: NumVariant): string {
  if (value === 0) return 'text-slate-300'
  switch (variant) {
    case 'revenue': return 'text-green-500'
    case 'expense': return 'text-red-400'
    case 'cogs':    return 'text-slate-400'
    case 'gross':   return value > 0 ? 'text-blue-500' : 'text-red-400'
    case 'net':     return value > 0 ? 'text-emerald-500' : 'text-red-400'
  }
}

/** Margin badge color — muted when no data (—) */
function marginBadgeCls(display: string, pctValue: number): string {
  if (display === '—') return 'bg-slate-100 text-slate-400'
  if (pctValue >= 30)  return 'bg-green-100 text-green-700'
  if (pctValue >= 10)  return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function netMarginBadgeCls(display: string, pctValue: number): string {
  if (display === '—') return 'bg-slate-100 text-slate-400'
  if (pctValue >= 20)  return 'bg-emerald-100 text-emerald-700'
  if (pctValue >= 5)   return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ months }: { months: PlRow[] }) {
  const maxAbs = Math.max(...months.map(r => Math.abs(r.net_profit)), 1)
  const BAR_H = 52  // px — total column height

  return (
    <div className="flex items-end gap-0.5 px-1" style={{ height: `${BAR_H + 20}px` }}>
      {months.map(r => {
        const isPos = r.net_profit >= 0
        const isEmpty = r.net_profit === 0 && r.revenue === 0
        const hPx = isEmpty ? 2 : Math.max(Math.round((Math.abs(r.net_profit) / maxAbs) * BAR_H), 3)
        return (
          <div
            key={r.month_key}
            className="group relative flex flex-1 flex-col items-center gap-1"
          >
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 shadow-md group-hover:block z-10 whitespace-nowrap text-left">
              <p className="text-[11px] font-semibold text-slate-700">{monthLabel(r.month_key)}</p>
              <p className={`text-[11px] font-bold ${numCls(r.net_profit, 'net')}`}>
                ฿{fmtAmount(r.net_profit)}
              </p>
            </div>
            {/* Bar */}
            <div className="flex w-full flex-col justify-end" style={{ height: `${BAR_H}px` }}>
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isEmpty ? 'bg-slate-100'
                  : isPos ? 'bg-emerald-400 group-hover:bg-emerald-500'
                  : 'bg-red-400 group-hover:bg-red-500'
                }`}
                style={{ height: `${hPx}px` }}
              />
            </div>
            {/* Axis label */}
            <span className="text-[9px] text-slate-400">{monthShort(r.month_key)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlReportPage() {
  const { user } = useAuth()
  const [rows, setRows]             = useState<PlRow[]>([])
  const [loading, setLoading]       = useState(true)
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

  /** All 12 months with zeroes for months without data (for chart) */
  const allMonths = useMemo<PlRow[]>(() => {
    const monthMap = new Map(rows.map(r => [r.month_key, r]))
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      return monthMap.get(key) ?? {
        month_key: key, revenue: 0, cogs: 0,
        gross_profit: 0, expenses: 0, net_profit: 0, doc_count: 0,
      }
    })
  }, [rows, year])

  function exportExcel() {
    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }
    const exportRows = [
      ...rows.map(r => ({
        เดือน: monthLabel(r.month_key),
        'รายได้ (฿)': r.revenue,
        'ต้นทุนขาย COGS (฿)': r.cogs,
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
        'ต้นทุนขาย COGS (฿)': totals.cogs,
        'กำไรขั้นต้น (฿)': totals.gross_profit,
        'Gross Margin (%)': pct(totals.gross_profit, totals.revenue),
        'ค่าใช้จ่าย (฿)': totals.expenses,
        'กำไรสุทธิ (฿)': totals.net_profit,
        'Net Margin (%)': pct(totals.net_profit, totals.revenue),
        จำนวนเอกสาร: totals.doc_count,
      },
    ]
    const ws = XLSX.utils.json_to_sheet(exportRows)
    ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `P&L ${year}`)
    XLSX.writeFile(wb, `pl_report_${year}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  // ─── KPI Cards config ────────────────────────────────────────────────────
  const cards = [
    { label: `รายได้รวม ${year}`, value: totals.revenue,      variant: 'revenue'  as NumVariant, Icon: TrendingUp  },
    { label: 'ต้นทุนขาย (COGS)', value: totals.cogs,          variant: 'cogs'     as NumVariant, Icon: TrendingDown },
    { label: 'กำไรขั้นต้น',      value: totals.gross_profit,  variant: 'gross'    as NumVariant, Icon: TrendingUp  },
    { label: 'ค่าใช้จ่าย',        value: totals.expenses,      variant: 'expense'  as NumVariant, Icon: Wallet      },
    { label: 'กำไรสุทธิ',         value: totals.net_profit,    variant: 'net'      as NumVariant, Icon: TrendingUp  },
  ]

  // ─── Table column headers ─────────────────────────────────────────────────
  const TABLE_HEADERS = [
    { label: 'เดือน',                  align: 'left'  },
    { label: 'รายได้',                 align: 'right' },
    { label: 'ต้นทุนขาย (COGS)',       align: 'right' },
    { label: 'กำไรขั้นต้น',            align: 'right' },
    { label: 'Gross Margin',           align: 'right' },
    { label: 'ค่าใช้จ่าย',             align: 'right' },
    { label: 'กำไรสุทธิ',              align: 'right' },
    { label: 'Net Margin',             align: 'right' },
  ]

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">กำไร & ขาดทุน (P&L)</h1>
          <p className="mt-1.5 text-sm text-slate-400">รายได้ − ต้นทุนขาย − ค่าใช้จ่าย = กำไรสุทธิ จากเอกสารที่ชำระแล้ว</p>
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

      {/* ── KPI Summary Cards ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(card => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${cardBg(card.value, card.variant)}`}>
            <div className="mb-2 flex items-center gap-2">
              <card.Icon size={15} className={cardIconCls(card.value, card.variant)} />
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
            </div>
            <p className={`text-xl font-bold ${numCls(card.value, card.variant)}`}>
              ฿{fmtAmount(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Trend Chart (Net Profit Sparkline) ── */}
      {!loading && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 pt-4 pb-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              แนวโน้มกำไรสุทธิรายเดือน {year}
            </p>
            {rows.length === 0 && (
              <span className="text-[10px] text-slate-300">ยังไม่มีข้อมูล</span>
            )}
          </div>
          <MiniBarChart months={allMonths} />
        </div>
      )}

      {/* ── Monthly Table ── */}
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
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {TABLE_HEADERS.map(h => (
                  <th
                    key={h.label}
                    className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      h.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const grossPct      = row.revenue > 0 ? row.gross_profit / row.revenue * 100 : 0
                const netPct        = row.revenue > 0 ? row.net_profit   / row.revenue * 100 : 0
                const grossDisplay  = pct(row.gross_profit, row.revenue)
                const netDisplay    = pct(row.net_profit,   row.revenue)
                return (
                  <tr key={row.month_key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">

                    {/* เดือน */}
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {monthLabel(row.month_key)}
                    </td>

                    {/* รายได้ */}
                    <td className={`px-4 py-4 text-right font-semibold tabular-nums ${numCls(row.revenue, 'revenue')}`}>
                      ฿{fmtAmount(row.revenue)}
                    </td>

                    {/* ต้นทุนขาย (COGS) */}
                    <td className="px-4 py-4 text-right tabular-nums">
                      {row.cogs > 0
                        ? <span className={numCls(row.cogs, 'cogs')}>฿{fmtAmount(row.cogs)}</span>
                        : <span className="text-gray-400">฿{fmtAmount(0)}</span>
                      }
                    </td>

                    {/* กำไรขั้นต้น */}
                    <td className={`px-4 py-4 text-right font-semibold tabular-nums ${numCls(row.gross_profit, 'gross')}`}>
                      ฿{fmtAmount(row.gross_profit)}
                    </td>

                    {/* Gross Margin badge */}
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${marginBadgeCls(grossDisplay, grossPct)}`}>
                        {grossDisplay}
                      </span>
                    </td>

                    {/* ค่าใช้จ่าย */}
                    <td className="px-4 py-4 text-right tabular-nums">
                      {row.expenses > 0
                        ? <span className={numCls(row.expenses, 'expense')}>฿{fmtAmount(row.expenses)}</span>
                        : <span className="text-gray-400">฿{fmtAmount(0)}</span>
                      }
                    </td>

                    {/* กำไรสุทธิ */}
                    <td className={`px-4 py-4 text-right font-bold tabular-nums ${numCls(row.net_profit, 'net')}`}>
                      ฿{fmtAmount(row.net_profit)}
                    </td>

                    {/* Net Margin badge */}
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${netMarginBadgeCls(netDisplay, netPct)}`}>
                        {netDisplay}
                      </span>
                    </td>

                  </tr>
                )
              })}
            </tbody>

            {/* Grand Total Row */}
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="px-4 py-4 font-bold text-slate-800">รวมทั้งปี {year}</td>

                <td className={`px-4 py-4 text-right font-bold tabular-nums ${numCls(totals.revenue, 'revenue')}`}>
                  ฿{fmtAmount(totals.revenue)}
                </td>

                <td className={`px-4 py-4 text-right font-bold tabular-nums ${numCls(totals.cogs, 'cogs')}`}>
                  ฿{fmtAmount(totals.cogs)}
                </td>

                <td className={`px-4 py-4 text-right font-bold tabular-nums ${numCls(totals.gross_profit, 'gross')}`}>
                  ฿{fmtAmount(totals.gross_profit)}
                </td>

                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-bold ${marginBadgeCls(pct(totals.gross_profit, totals.revenue), totals.revenue > 0 ? totals.gross_profit / totals.revenue * 100 : 0)}`}>
                    {pct(totals.gross_profit, totals.revenue)}
                  </span>
                </td>

                <td className={`px-4 py-4 text-right font-bold tabular-nums ${numCls(totals.expenses, 'expense')}`}>
                  ฿{fmtAmount(totals.expenses)}
                </td>

                <td className={`px-4 py-4 text-right text-lg font-bold tabular-nums ${numCls(totals.net_profit, 'net')}`}>
                  ฿{fmtAmount(totals.net_profit)}
                </td>

                <td className="px-4 py-4 text-right">
                  <span className={`text-sm font-bold ${netMarginBadgeCls(pct(totals.net_profit, totals.revenue), totals.revenue > 0 ? totals.net_profit / totals.revenue * 100 : 0)}`}>
                    {pct(totals.net_profit, totals.revenue)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
