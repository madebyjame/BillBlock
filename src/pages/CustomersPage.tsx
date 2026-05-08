import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Download, Users, X, FileText } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import { KebabMenu } from '../components/KebabMenu'
import { Pagination } from '../components/Pagination'
import { FormField } from '../components/FormField'
import UpgradeModal from '../components/UpgradeModal'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  createCustomer, deleteCustomer, listCustomers, updateCustomer,
  type CustomerInput, type CustomerRow,
} from '../lib/customerApi'
import { PlanLimitError } from '../lib/planLimits'

const EMPTY_FORM: CustomerInput = {
  name: '', address: '', tax_id: '', email: '', phone: '',
  contact_person: '', status: 'active', tags: [],
  billing_address: '', shipping_address: '', credit_term: '', salesperson: '',
}

const PAGE_SIZE = 10

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: 'ใช้งาน',    cls: 'bg-green-100 text-green-700' },
  inactive: { label: 'ไม่ใช้งาน', cls: 'bg-slate-100 text-slate-500' },
  vip:      { label: 'VIP',        cls: 'bg-yellow-100 text-yellow-700' },
  blocked:  { label: 'ระงับ',      cls: 'bg-red-100 text-red-600' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' }
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
}

// ─── Customer History Modal ────────────────────────────────────────────────────

interface HistoryDoc {
  id: string
  doc_type: string
  status: string
  total_amount: number
  created_at: string
  doc_number?: string
}

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation:      'ใบเสนอราคา',
  invoice:        'ใบแจ้งหนี้',
  receipt:        'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice':  'ใบกำกับภาษี',
}

function fmtAmount(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
}

function CustomerHistoryModal({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  const [docs, setDocs] = useState<HistoryDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('documents')
          .select('id, doc_type, status, total_amount, created_at, content')
          .order('created_at', { ascending: false })
        const matched: HistoryDoc[] = (data ?? [])
          .filter((d: Record<string, unknown>) => {
            const c = d.content as { customer?: { name?: string } } | null
            return c?.customer?.name?.trim() === customer.name.trim()
          })
          .map((d: Record<string, unknown>) => {
            const c = d.content as { docMeta?: { number?: string } } | null
            return {
              id: d.id as string,
              doc_type: d.doc_type as string,
              status: d.status as string,
              total_amount: d.total_amount as number,
              created_at: d.created_at as string,
              doc_number: c?.docMeta?.number,
            }
          })
        setDocs(matched)
      } finally {
        setLoading(false)
      }
    })()
  }, [customer.name])

  const totalPaid = docs
    .filter(d => d.doc_type === 'invoice' && d.status === 'paid')
    .reduce((s, d) => s + d.total_amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">ประวัติลูกค้า — {customer.name}</h2>
            {!loading && <p className="text-xs text-slate-500 mt-0.5">ยอดชำระรวม: ฿{fmtAmount(totalPaid)} ({docs.length} รายการ)</p>}
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X size={15} className="text-slate-500" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={28} className="mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">ไม่พบประวัติเอกสารของลูกค้านี้</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">เลขที่</th>
                  <th className="pb-2 font-medium">ประเภท</th>
                  <th className="pb-2 font-medium">สถานะ</th>
                  <th className="pb-2 text-right font-medium">ยอด</th>
                  <th className="pb-2 text-right font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {docs.map(doc => (
                  <tr key={doc.id}>
                    <td className="py-2 font-mono text-xs text-blue-600">{doc.doc_number || '—'}</td>
                    <td className="py-2 text-slate-600">{DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}</td>
                    <td className="py-2 text-slate-500">{doc.status}</td>
                    <td className="py-2 text-right font-semibold text-slate-700">฿{fmtAmount(doc.total_amount)}</td>
                    <td className="py-2 text-right text-slate-400">{fmtDate(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
  const [upgradeModal, setUpgradeModal] = useState<{ resource: 'customers'; limit: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [historyCustomer, setHistoryCustomer] = useState<CustomerRow | null>(null)
  const [tagInput, setTagInput] = useState('')

  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor : '#1e3a8a'

  useEffect(() => { void loadRows() }, [])

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
      r.phone.toLowerCase().includes(q) ||
      r.contact_person.toLowerCase().includes(q) ||
      r.salesperson.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
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
      if (next.has(id)) next.delete(id); else next.add(id)
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

  function exportCsv() {
    const header = ['ชื่อลูกค้า/บริษัท', 'ผู้ติดต่อ', 'เลขผู้เสียภาษี', 'โทรศัพท์', 'อีเมล', 'สถานะ', 'แท็ก', 'เครดิตเทอม', 'เซลส์ผู้ดูแล', 'ที่อยู่', 'ที่อยู่ออกบิล', 'ที่อยู่จัดส่ง']
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const csvRows = [
      header.join(','),
      ...filtered.map(r => [
        esc(r.name), esc(r.contact_person), esc(r.tax_id), esc(r.phone), esc(r.email),
        esc(STATUS_META[r.status]?.label ?? r.status), esc(r.tags.join(', ')),
        esc(r.credit_term), esc(r.salesperson), esc(r.address),
        esc(r.billing_address), esc(r.shipping_address),
      ].join(',')),
    ]
    const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('ส่งออก CSV แล้ว')
  }

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setTagInput(''); setShowModal(true) }
  function openEdit(row: CustomerRow) {
    setEditingId(row.id)
    setForm({
      name: row.name, address: row.address, tax_id: row.tax_id,
      email: row.email, phone: row.phone, contact_person: row.contact_person,
      status: row.status, tags: [...row.tags], billing_address: row.billing_address,
      shipping_address: row.shipping_address, credit_term: row.credit_term, salesperson: row.salesperson,
    })
    setTagInput('')
    setShowModal(true)
  }

  function addTag(val: string) {
    const t = val.trim()
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setTagInput('')
  }

  function removeTag(t: string) {
    setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))
  }

  async function onSubmit() {
    if (!user || saving || !form.name.trim()) return
    setSaving(true)
    try {
      if (editingId) { await updateCustomer(editingId, form); toast.success('อัปเดตข้อมูลลูกค้าแล้ว') }
      else { await createCustomer(user.id, form); toast.success('เพิ่มข้อมูลลูกค้าแล้ว') }
      setShowModal(false)
      await loadRows()
    } catch (err) {
      if (err instanceof PlanLimitError) {
        setShowModal(false)
        setUpgradeModal({ resource: 'customers', limit: err.limit })
      } else {
        toast.error('บันทึกข้อมูลลูกค้าไม่สำเร็จ')
      }
    }
    finally { setSaving(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('ลบข้อมูลลูกค้านี้?')) return
    try { await deleteCustomer(id); toast.success('ลบข้อมูลลูกค้าแล้ว'); await loadRows() }
    catch { toast.error('ลบไม่สำเร็จ') }
  }

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none'

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {upgradeModal && (
        <UpgradeModal
          resource={upgradeModal.resource}
          limit={upgradeModal.limit}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">ลูกค้า</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download size={15} /> Export CSV
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
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="ค้นหาชื่อ / ผู้ติดต่อ / เลขผู้เสียภาษี / เบอร์โทร / แท็ก / เซลส์"
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
        {loading ? <TableSkeleton cols={7} rows={6} hasCheckbox /> : (<>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleAll}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-700" />
                  </th>
                  <th className="px-4 py-3 font-semibold">ชื่อลูกค้า/บริษัท</th>
                  <th className="px-4 py-3 font-semibold">ผู้ติดต่อ</th>
                  <th className="px-4 py-3 font-semibold">โทรศัพท์</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  <th className="px-4 py-3 font-semibold">แท็ก</th>
                  <th className="px-4 py-3 font-semibold">เซลส์</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
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
                      <button
                        onClick={() => setHistoryCustomer(row)}
                        className="font-medium text-blue-600 hover:underline text-left"
                      >
                        {row.name}
                      </button>
                      {row.tax_id && <p className="text-[11px] text-slate-400">{row.tax_id}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.contact_person || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.phone || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.tags.length > 0
                          ? row.tags.map(t => (
                            <span key={t} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">{t}</span>
                          ))
                          : <span className="text-slate-400">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.salesperson || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <KebabMenu
                        onEdit={() => openEdit(row)}
                        onDelete={() => void onDelete(row.id)}
                        deleteLabel="ลบลูกค้า"
                        extraItems={[{ label: 'ประวัติลูกค้า', onClick: () => setHistoryCustomer(row) }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={p => { setPage(p); setSelectedIds(new Set()) }} />
        </>)}
      </div>

      {/* Customer History Modal */}
      {historyCustomer && (
        <CustomerHistoryModal customer={historyCustomer} onClose={() => setHistoryCustomer(null)} />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingId ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'}
            </h2>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ข้อมูลทั่วไป</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
              <FormField label="ชื่อลูกค้า/บริษัท *">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="ผู้ติดต่อ (Contact Person)">
                <input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="เลขผู้เสียภาษี">
                <input value={form.tax_id} onChange={e => setForm(p => ({ ...p, tax_id: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="โทรศัพท์">
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="อีเมล">
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
              </FormField>
              <FormField label="สถานะ">
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                  <option value="vip">VIP</option>
                  <option value="blocked">ระงับ</option>
                </select>
              </FormField>
              <FormField label="เครดิตเทอม">
                <input value={form.credit_term} onChange={e => setForm(p => ({ ...p, credit_term: e.target.value }))}
                  placeholder="เช่น Net 30" className={inputCls} />
              </FormField>
              <FormField label="เซลส์ผู้ดูแล">
                <input value={form.salesperson} onChange={e => setForm(p => ({ ...p, salesperson: e.target.value }))} className={inputCls} />
              </FormField>

              {/* Tags */}
              <div className="md:col-span-2">
                <FormField label="ป้ายกำกับ (Tags)">
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 px-3 py-2 min-h-[38px]">
                    {form.tags.map(t => (
                      <span key={t} className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="text-blue-400 hover:text-blue-700"><X size={10} /></button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
                      placeholder={form.tags.length === 0 ? 'พิมพ์แล้ว Enter เพื่อเพิ่มแท็ก' : ''}
                      className="flex-1 min-w-[120px] border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">ที่อยู่</p>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <FormField label="ที่อยู่หลัก">
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
              </FormField>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField label="ที่อยู่ออกบิล">
                  <textarea value={form.billing_address} onChange={e => setForm(p => ({ ...p, billing_address: e.target.value }))}
                    className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                </FormField>
                <FormField label="ที่อยู่จัดส่ง">
                  <textarea value={form.shipping_address} onChange={e => setForm(p => ({ ...p, shipping_address: e.target.value }))}
                    className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none" />
                </FormField>
              </div>
            </div>

            <div className="flex justify-end gap-2">
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
