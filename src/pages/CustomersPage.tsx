import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, FileUp, MoreVertical, Pencil, Trash2, Users } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  createCustomer, deleteCustomer, listCustomers, updateCustomer,
  type CustomerInput, type CustomerRow,
} from '../lib/customerApi'

const EMPTY_FORM: CustomerInput = { name: '', address: '', tax_id: '', email: '', phone: '' }
const PAGE_SIZE = 10

// ─── Kebab Menu (portal) ──────────────────────────────────────────────────────

function KebabMenu({
  onEdit, onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function handleOpen(e: MouseEvent) {
    e.stopPropagation()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.right - 160 })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="เมนู"
      >
        <MoreVertical size={15} />
      </button>
      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={13} className="text-slate-400" /> แก้ไข
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} /> ลบลูกค้า
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-400">{total} รายการ</p>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">‹ ก่อนหน้า</button>
        {pages.map((p, i) => p === '…'
          ? <span key={`e${i}`} className="px-1 text-xs text-slate-300">…</span>
          : <button key={p} onClick={() => onPage(p as number)} className={`min-w-7 rounded-lg px-2 py-1 text-xs transition-colors ${p === page ? 'bg-slate-800 font-semibold text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
        )}
        <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">ถัดไป ›</button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => { void loadRows() }, [])
  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { setSelectedIds(new Set()) }, [page])

  async function loadRows() {
    setLoading(true)
    try { setRows(await listCustomers()) }
    catch { toast.error('โหลดรายชื่อลูกค้าไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.tax_id.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q)
    )
  }, [rows, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const allPageSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.id))

  function toggleAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) paginated.forEach(r => next.delete(r.id))
      else paginated.forEach(r => next.add(r.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (!confirm(`ลบลูกค้า ${selectedIds.size} รายการ?`)) return
    try {
      await Promise.all([...selectedIds].map(id => deleteCustomer(id)))
      toast.success(`ลบลูกค้า ${selectedIds.size} รายการแล้ว`)
      setSelectedIds(new Set())
      await loadRows()
    } catch { toast.error('ลบไม่สำเร็จ กรุณาลองใหม่') }
  }

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(row: CustomerRow) {
    setEditingId(row.id)
    setForm({ name: row.name, address: row.address, tax_id: row.tax_id, email: row.email, phone: row.phone })
    setShowModal(true)
  }

  async function onSubmit() {
    if (!user || saving || !form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) { await updateCustomer(editingId, form); toast.success('อัปเดตข้อมูลลูกค้าแล้ว') }
      else { await createCustomer(user.id, form); toast.success('เพิ่มข้อมูลลูกค้าแล้ว') }
      setShowModal(false)
      await loadRows()
    } catch { toast.error('บันทึกข้อมูลลูกค้าไม่สำเร็จ') }
    finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('ลบข้อมูลลูกค้านี้?')) return
    try { await deleteCustomer(id); toast.success('ลบข้อมูลลูกค้าแล้ว'); await loadRows() }
    catch { toast.error('ลบไม่สำเร็จ') }
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">ลูกค้า</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('ฟีเจอร์นำเข้า Excel กำลังพัฒนา')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileUp size={15} /> นำเข้าจาก Excel
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={16} /> เพิ่มข้อมูลใหม่
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า / เลขผู้เสียภาษี / เบอร์โทร"
          className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2.5">
          <span className="text-sm text-white">เลือก {selectedIds.size} รายการ</span>
          <button onClick={() => void handleBulkDelete()} className="text-sm font-medium text-red-400 hover:text-red-300">
            ลบที่เลือก
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? <TableSkeleton cols={4} rows={6} hasCheckbox /> : (<>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                </th>
                <th className="px-4 py-3 font-semibold">ชื่อลูกค้า/บริษัท</th>
                <th className="px-4 py-3 font-semibold">เลขผู้เสียภาษี</th>
                <th className="px-4 py-3 font-semibold">โทรศัพท์</th>
                <th className="px-4 py-3 font-semibold">อีเมล</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users size={22} />}
                      title={rows.length === 0 ? 'ยังไม่มีข้อมูลลูกค้า' : 'ไม่พบลูกค้าที่ตรงกับเงื่อนไข'}
                      description={
                        rows.length === 0
                          ? 'คลิก "เพิ่มข้อมูลใหม่" เพื่อเพิ่มข้อมูลลูกค้ารายการแรก'
                          : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง'
                      }
                    />
                  </td>
                </tr>
              ) : paginated.map(row => (
                <tr key={row.id} className={`border-t border-slate-100 transition-colors ${selectedIds.has(row.id) ? 'bg-slate-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </td>
                  <td className="px-4 py-3">
                    {/* TODO: navigate to /customers/:id when Customer Profile page is ready */}
                    <button
                      onClick={() => toast.info('Customer Profile กำลังพัฒนา')}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.tax_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{row.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{row.email || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <KebabMenu onEdit={() => openEdit(row)} onDelete={() => void onDelete(row.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
        </>)}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingId ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="ชื่อลูกค้า/บริษัท">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <Field label="เลขผู้เสียภาษี">
                <input value={form.tax_id} onChange={e => setForm(p => ({ ...p, tax_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <Field label="โทรศัพท์">
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <Field label="อีเมล">
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </Field>
              <div className="md:col-span-2">
                <Field label="ที่อยู่">
                  <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                </Field>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">ยกเลิก</button>
              <button onClick={() => void onSubmit()} disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: themeColor }}>บันทึก</button>
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

