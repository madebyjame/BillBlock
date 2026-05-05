import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductInput,
  type ProductRow,
} from '../lib/productApi'

const EMPTY_FORM: ProductInput = {
  name: '',
  price: 0,
  unit: '',
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  useEffect(() => {
    void loadRows()
  }, [])

  async function loadRows() {
    setLoading(true)
    try {
      setRows(await listProducts())
    } catch {
      toast.error('โหลดรายการสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.name.toLowerCase().includes(q) || row.unit.toLowerCase().includes(q))
  }, [rows, search])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(row: ProductRow) {
    setEditingId(row.id)
    setForm({ name: row.name, price: row.price, unit: row.unit })
    setShowModal(true)
  }

  async function onSubmit() {
    if (!user || saving || !form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateProduct(editingId, form)
        toast.success('อัปเดตข้อมูลสินค้าแล้ว')
      } else {
        await createProduct(user.id, form)
        toast.success('เพิ่มข้อมูลสินค้าแล้ว')
      }
      setShowModal(false)
      await loadRows()
    } catch {
      toast.error('บันทึกข้อมูลสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('ลบข้อมูลสินค้านี้?')) return
    try {
      await deleteProduct(id)
      toast.success('ลบข้อมูลสินค้าแล้ว')
      await loadRows()
    } catch {
      toast.error('ลบข้อมูลสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">สินค้า</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: themeColor }}
        >
          <Plus size={16} />
          เพิ่มข้อมูลใหม่
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ค้นหาชื่อสินค้า/บริการ หรือ หน่วย"
          className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">ชื่อสินค้า/บริการ</th>
                <th className="px-4 py-3 font-semibold">หน่วย</th>
                <th className="px-4 py-3 font-semibold text-right">ราคา/หน่วย</th>
                <th className="w-40 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-slate-400">ยังไม่มีข้อมูลสินค้า</td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                  <td className="px-4 py-3 text-slate-500">{row.unit || '-'}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(row)} className="mr-2 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">Edit</button>
                    <button onClick={() => void onDelete(row.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">{editingId ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มข้อมูลสินค้า'}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="ชื่อสินค้า/บริการ">
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <Field label="หน่วย">
                <input value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <Field label="ราคา/หน่วย">
                <input type="number" min={0} value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">ยกเลิก</button>
              <button onClick={() => void onSubmit()} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: themeColor }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function SkeletonTable() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="mb-3 h-10 rounded bg-slate-100 last:mb-0" />
      ))}
    </div>
  )
}
