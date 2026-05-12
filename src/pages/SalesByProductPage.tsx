import { useEffect, useState } from 'react'
import { Package, FileSpreadsheet, Lock, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { usePlan } from '../hooks/usePlan'
import ProUpgradeWall from '../components/ProUpgradeWall'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesRow {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
  cogs: number
  gross_profit: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(n: number) {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)
}

function pct(a: number, b: number) {
  if (b === 0) return '—'
  return (a / b * 100).toFixed(1) + '%'
}

function currentYear() { return new Date().getFullYear() }

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalesByProductPage() {
  const { isPro, isBusiness } = usePlan()
  const [rows, setRows]       = useState<SalesRow[]>([])
  const [loading, setLoading] = useState(true)

  const [year, setYear] = useState(currentYear)
  const availableYears  = [currentYear(), currentYear() - 1, currentYear() - 2]

  const dateFrom = `${year}-01-01`
  const dateTo   = `${year}-12-31`

  useEffect(() => { void load() }, [year]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_sales_by_product', { p_date_from: dateFrom, p_date_to: dateTo })
      if (error) throw error
      setRows((data ?? []).map((r: Record<string, unknown>) => ({
        product_id:    String(r.product_id),
        product_name:  String(r.product_name),
        quantity_sold: Number(r.quantity_sold),
        revenue:       Number(r.revenue),
        cogs:          Number(r.cogs),
        gross_profit:  Number(r.gross_profit),
      })))
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue     = rows.reduce((s, r) => s + r.revenue, 0)
  const totalCogs        = rows.reduce((s, r) => s + r.cogs, 0)
  const totalGrossProfit = rows.reduce((s, r) => s + r.gross_profit, 0)

  function exportExcel() {
    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }
    const data = rows.map((r, i) => ({
      ลำดับ: i + 1,
      สินค้า: r.product_name,
      'จำนวนขาย': r.quantity_sold,
      'รายได้ (฿)': r.revenue,
      'สัดส่วน': pct(r.revenue, totalRevenue),
      'COGS (฿)': r.cogs,
      'กำไรขั้นต้น (฿)': r.gross_profit,
      'Gross Margin': pct(r.gross_profit, r.revenue),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `ขายต่อสินค้า ${year}`)
    XLSX.writeFile(wb, `sales_by_product_${year}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  if (!isPro) return <ProUpgradeWall feature="reports" />

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">ยอดขายต่อสินค้า</h1>
          <p className="mt-1.5 text-sm text-slate-400">รายได้และกำไรรายสินค้า จากเอกสารที่ชำระแล้ว</p>
        </div>
        <button
          onClick={() => isBusiness ? exportExcel() : toast.error('ฟีเจอร์นี้ต้องการแผน Business')}
          title={isBusiness ? undefined : 'ต้องการแผน Business'}
          className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 ${!isBusiness ? 'opacity-60' : ''}`}
        >
          {isBusiness ? <FileSpreadsheet size={15} className="text-green-600" /> : <Lock size={15} className="text-slate-400" />}
          Export Excel
        </button>
      </div>

      {/* Year selector */}
      <div className="mb-6 flex items-center gap-2">
        {availableYears.map(y => (
          <button key={y} onClick={() => setYear(y)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              year === y ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}>
            {y}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'รายได้รวม', value: totalRevenue, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
          { label: 'COGS รวม', value: totalCogs, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
          { label: 'กำไรขั้นต้น', value: totalGrossProfit, color: totalGrossProfit >= 0 ? 'text-blue-700' : 'text-red-600', bg: totalGrossProfit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.bg}`}>
            <p className="mb-2 text-xs font-medium text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>฿{fmtAmount(card.value)}</p>
            {card.label === 'กำไรขั้นต้น' && totalRevenue > 0 && (
              <p className="mt-1 text-xs text-slate-400">Gross Margin {pct(totalGrossProfit, totalRevenue)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <Package size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ไม่พบข้อมูลการขายในปี {year}</p>
          <p className="mt-1 text-xs text-slate-300">เปลี่ยนสถานะเอกสารเป็น "ชำระแล้ว" เพื่อให้ปรากฏในรายงาน</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">#</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">สินค้า</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">จำนวนขาย</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">รายได้</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">สัดส่วน</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">COGS</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">กำไรขั้นต้น</th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const margin     = row.revenue > 0 ? (row.gross_profit / row.revenue * 100) : 0
                const shareWidth = totalRevenue > 0 ? (row.revenue / totalRevenue * 100) : 0
                return (
                  <tr key={row.product_id + row.product_name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={13} className={row.gross_profit >= 0 ? 'text-green-400' : 'text-red-400'} />
                        <div>
                          <p className="font-medium text-slate-700">{row.product_name}</p>
                          {/* Revenue share bar */}
                          <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-400" style={{ width: `${shareWidth}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500">{fmtQty(row.quantity_sold)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-green-700">฿{fmtAmount(row.revenue)}</td>
                    <td className="px-5 py-4 text-right text-xs text-slate-400">{pct(row.revenue, totalRevenue)}</td>
                    <td className="px-5 py-4 text-right text-slate-500">
                      {row.cogs > 0 ? `฿${fmtAmount(row.cogs)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-5 py-4 text-right font-bold ${row.gross_profit < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                      ฿{fmtAmount(row.gross_profit)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        margin >= 30 ? 'bg-green-100 text-green-700' :
                        margin >= 10 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {pct(row.gross_profit, row.revenue)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-5 py-4 font-bold text-slate-700">รวม {rows.length} รายการ</td>
                <td className="px-5 py-4 text-right font-bold text-green-700">฿{fmtAmount(totalRevenue)}</td>
                <td />
                <td className="px-5 py-4 text-right font-bold text-slate-600">฿{fmtAmount(totalCogs)}</td>
                <td className={`px-5 py-4 text-right text-lg font-bold ${totalGrossProfit < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                  ฿{fmtAmount(totalGrossProfit)}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="text-sm font-bold text-slate-600">{pct(totalGrossProfit, totalRevenue)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
