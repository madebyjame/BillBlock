import { useEffect, useState } from 'react'
import { Plus, Trash2, FileSpreadsheet, Lock, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../hooks/usePlan'
import {
  EXPENSE_CATEGORIES,
  getCategoryMeta,
  listExpenses,
  createExpense,
  deleteExpense,
  type ExpenseRow,
  type ExpenseCategory,
  type CreateExpenseInput,
} from '../lib/expenseApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

// ─── Add Expense Form ─────────────────────────────────────────────────────────

function AddExpenseForm({ onSave, onCancel }: { onSave: (input: CreateExpenseInput) => Promise<void>; onCancel: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [amount, setAmount]   = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [date, setDate]       = useState(today)
  const [vendor, setVendor]   = useState('')
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('กรุณาระบุจำนวนเงิน'); return }
    setSaving(true)
    try {
      await onSave({ amount: amt, category, expense_date: date, vendor: vendor || undefined, note: note || undefined })
      toast.success('บันทึกค่าใช้จ่ายแล้ว')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">เพิ่มค่าใช้จ่าย</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Amount */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">จำนวนเงิน (฿) *</label>
          <input
            type="number" min="0.01" step="0.01" required
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        {/* Category */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">หมวดหมู่ *</label>
          <select
            value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        {/* Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">วันที่ *</label>
          <input
            type="date" required
            value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        {/* Vendor */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">ผู้รับเงิน</label>
          <input
            type="text"
            value={vendor} onChange={e => setVendor(e.target.value)}
            placeholder="ชื่อร้าน/บริษัท"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>
      {/* Note */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">หมายเหตุ</label>
        <input
          type="text"
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="รายละเอียดเพิ่มเติม"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { user } = useAuth()
  const { isBusiness } = usePlan()
  const { year: initYear, month: initMonth } = currentYearMonth()
  const [year, setYear]   = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [rows, setRows]   = useState<ExpenseRow[]>([])
  const [loading, setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const dateTo   = new Date(year, month, 0).toISOString().split('T')[0]

  useEffect(() => { void load() }, [year, month])  // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      setRows(await listExpenses(user.id, dateFrom, dateTo))
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(input: CreateExpenseInput) {
    if (!user) return
    await createExpense(user.id, input)
    setShowForm(false)
    void load()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deleteExpense(id)
      toast.success('ลบแล้ว')
      void load()
    } catch {
      toast.error('ลบไม่สำเร็จ')
    } finally {
      setDeleting(null)
    }
  }

  // Totals
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const byCategory = EXPENSE_CATEGORIES.map(c => ({
    ...c,
    total: rows.filter(r => r.category === c.value).reduce((s, r) => s + r.amount, 0),
  })).filter(c => c.total > 0)

  // Available years
  const years = [initYear, initYear - 1, initYear - 2]

  function exportExcel() {
    if (rows.length === 0) { toast.error('ไม่มีข้อมูล'); return }
    const data = rows.map(r => ({
      วันที่: fmtDate(r.expense_date),
      หมวดหมู่: getCategoryMeta(r.category).label,
      ผู้รับเงิน: r.vendor ?? '',
      หมายเหตุ: r.note ?? '',
      'จำนวนเงิน (฿)': r.amount,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 24 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `ค่าใช้จ่าย ${MONTHS_TH[month-1]} ${year}`)
    XLSX.writeFile(wb, `expenses_${year}_${String(month).padStart(2,'0')}.xlsx`)
    toast.success('Export Excel สำเร็จ')
  }

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">ค่าใช้จ่าย</h1>
          <p className="mt-1.5 text-sm text-slate-400">บันทึกค่าใช้จ่ายดำเนินงานเพื่อคำนวณกำไรสุทธิใน P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => isBusiness ? exportExcel() : toast.error('ฟีเจอร์นี้ต้องการแผน Business')}
            title={isBusiness ? undefined : 'ต้องการแผน Business'}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 ${!isBusiness ? 'opacity-60' : ''}`}
          >
            {isBusiness ? <FileSpreadsheet size={15} className="text-green-600" /> : <Lock size={15} className="text-slate-400" />}
            Export Excel
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <Plus size={16} />
            เพิ่มค่าใช้จ่าย
          </button>
        </div>
      </div>

      {/* Month/Year selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Year */}
        <div className="flex items-center gap-1">
          {years.map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                year === y ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}>
              {y}
            </button>
          ))}
        </div>
        {/* Month */}
        <div className="flex flex-wrap gap-1">
          {MONTHS_TH.map((m, i) => (
            <button key={i} onClick={() => setMonth(i + 1)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                month === i + 1 ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary card */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm lg:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <Wallet size={15} className="text-red-500" />
            <p className="text-xs font-medium text-slate-500">รวมค่าใช้จ่าย</p>
          </div>
          <p className="text-2xl font-bold text-red-700">฿{fmtAmount(total)}</p>
          <p className="mt-1 text-xs text-slate-400">{rows.length} รายการ</p>
        </div>
        {byCategory.slice(0, 3).map(c => (
          <div key={c.value} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.color}`}>{c.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-700">฿{fmtAmount(c.total)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {total > 0 ? ((c.total / total) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6">
          <AddExpenseForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
          <Wallet size={28} className="mb-3 opacity-40" />
          <p className="text-sm">ยังไม่มีค่าใช้จ่ายในเดือนนี้</p>
          <p className="mt-1 text-xs text-slate-300">กดปุ่ม "เพิ่มค่าใช้จ่าย" เพื่อบันทึก</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                {['วันที่', 'หมวดหมู่', 'ผู้รับเงิน / หมายเหตุ', 'จำนวนเงิน', ''].map(h => (
                  <th key={h} className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${h === 'จำนวนเงิน' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const meta = getCategoryMeta(row.category)
                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{fmtDate(row.expense_date)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">{row.vendor ?? '—'}</p>
                      {row.note && <p className="text-xs text-slate-400">{row.note}</p>}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-red-600">฿{fmtAmount(row.amount)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => void handleDelete(row.id)}
                        disabled={deleting === row.id}
                        className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-5 py-4 font-bold text-slate-700">
                  รวม {MONTHS_TH[month-1]} {year}
                </td>
                <td className="px-5 py-4 text-right text-lg font-bold text-red-700">฿{fmtAmount(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
