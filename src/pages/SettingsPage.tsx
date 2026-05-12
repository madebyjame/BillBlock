import type { ChangeEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart2,
  Building2,
  Check,
  CheckCircle2,
  Contact,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Layers,
  MapPin,
  PenLine,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '../components/ConfirmDialog'
import OmiseCheckoutModal from '../components/OmiseCheckoutModal'
import { useConfirm } from '../hooks/useConfirm'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile, uploadCompanyFile, deleteCompanyFile } from '../lib/profileApi'
import type { Profile } from '../lib/profileApi'
import { usePlan } from '../hooks/usePlan'
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES } from '../lib/planLimits'
import { supabase } from '../lib/supabase'
import { listSignatures, saveSignature, deleteSignature, setDefaultSignature } from '../lib/signatureApi'
import type { SavedSignature } from '../lib/signatureApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'company' | 'design' | 'payment' | 'defaults' | 'billing'
type FormState = Omit<Profile, 'id'>

// ─── Constants ────────────────────────────────────────────────────────────────

interface TabDef {
  id: TabId
  label: string
  icon: ReactNode
}

const TABS: TabDef[] = [
  { id: 'company',  label: 'ข้อมูลองค์กร',    icon: <Building2  size={15} /> },
  { id: 'design',   label: 'หน้าตาเอกสาร',   icon: <FileText   size={15} /> },
  { id: 'payment',  label: 'ช่องทางรับเงิน',  icon: <CreditCard size={15} /> },
  { id: 'defaults', label: 'ตั้งค่าเริ่มต้น', icon: <Settings2  size={15} /> },
  { id: 'billing',  label: 'แผน & Billing',   icon: <Zap        size={15} /> },
]

const THEME_COLORS: { label: string; value: string }[] = [
  { label: 'น้ำเงิน', value: '#1e3a8a' },
  { label: 'ดำ',     value: '#1e293b' },
  { label: 'แดง',    value: '#b91c1c' },
  { label: 'เขียว',  value: '#15803d' },
  { label: 'ม่วง',   value: '#6d28d9' },
]

const THAI_BANKS: string[] = [
  'ธนาคารกสิกรไทย (KBank)',
  'ธนาคารไทยพาณิชย์ (SCB)',
  'ธนาคารกรุงเทพ (BBL)',
  'ธนาคารกรุงไทย (KTB)',
  'ธนาคารกรุงศรีอยุธยา (BAY)',
  'ธนาคารทหารไทยธนชาต (TTB)',
  'ธนาคารออมสิน (GSB)',
  'ธนาคารเพื่อการเกษตรและสหกรณ์ (BAAC)',
  'ธนาคารอาคารสงเคราะห์ (GHB)',
  'ธนาคารซีไอเอ็มบีไทย (CIMB)',
  'ธนาคารยูโอบี (UOB)',
  'ธนาคารแลนด์แอนด์เฮ้าส์ (LHBank)',
  'อื่นๆ',
]

const VAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'none',     label: 'ไม่มี VAT' },
  { value: 'included', label: 'รวม VAT 7% ในราคา' },
  { value: 'excluded', label: 'แยก VAT 7% ออกจากราคา' },
]

const EMPTY_FORM: FormState = {
  company_name:        '',
  address:             '',
  tax_id:              '',
  phone:               '',
  email:               '',
  website:             '',
  logo_url:            '',
  signature_url:       '',
  theme_color:         '#1e3a8a',
  invoice_prefix:      'INV',
  quotation_prefix:    'QT',
  receipt_prefix:      'REC',
  billing_note_prefix: 'BN',
  tax_invoice_prefix:  'TAX',
  bank_name:           '',
  bank_branch:         '',
  bank_account_name:   '',
  bank_account_number: '',
  bank_note:           '',
  promptpay_id:        '',
  vat_type:            'none',
  credit_days:         30,
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(
    () => (searchParams.get('tab') as TabId | null) ?? 'company'
  )
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm)

  // ── Load profile ──
  useEffect(() => {
    if (!user) { setLoading(false); return }
    getProfile(user.id)
      .then((profile) => {
        const init: FormState = profile
          ? {
              company_name:        profile.company_name,
              address:             profile.address,
              tax_id:              profile.tax_id,
              phone:               profile.phone,
              email:               profile.email || user.email || '',
              website:             profile.website,
              logo_url:            profile.logo_url,
              signature_url:       profile.signature_url,
              theme_color:         profile.theme_color || '#1e3a8a',
              invoice_prefix:      profile.invoice_prefix      || 'INV',
              quotation_prefix:    profile.quotation_prefix    || 'QT',
              receipt_prefix:      profile.receipt_prefix      || 'REC',
              billing_note_prefix: profile.billing_note_prefix || 'BN',
              tax_invoice_prefix:  profile.tax_invoice_prefix  || 'TAX',
              bank_name:           profile.bank_name,
              bank_branch:         profile.bank_branch,
              bank_account_name:   profile.bank_account_name,
              bank_account_number: profile.bank_account_number,
              bank_note:           profile.bank_note,
              promptpay_id:        profile.promptpay_id || '',
              vat_type:            profile.vat_type || 'none',
              credit_days:         profile.credit_days ?? 30,
            }
          : { ...EMPTY_FORM, email: user.email ?? '' }
        setForm(init)
        setSavedForm(init)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
      })
      .finally(() => setLoading(false))
  }, [user])

  // ── Helpers ──
  function update(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleUpload(type: 'logo', file: File) {
    if (!user) return
    setUploadingLogo(true)
    try {
      const url = await uploadCompanyFile(user.id, type, file)
      update({ logo_url: url })
      toast.success('อัปโหลดโลโก้เรียบร้อย')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleLogoClear() {
    if (!user) return
    update({ logo_url: '' })
    try {
      await deleteCompanyFile(user.id, 'logo')
    } catch { /* best-effort */ }
  }

  async function handleSave() {
    if (!user || saving) return
    setSaving(true)
    try {
      await upsertProfile({ id: user.id, ...form })
      setSavedForm(form)
      toast.success('บันทึกข้อมูลเรียบร้อย', { id: 'settings-save' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="mx-auto max-w-4xl p-6 pb-36 md:p-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-800">ตั้งค่า</h1>

      {/* ── Tab bar ── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'company' && (
        <CompanyTab form={form} update={update} />
      )}
      {activeTab === 'design' && (
        <DesignTab
          form={form}
          update={update}
          uploadingLogo={uploadingLogo}
          onUploadLogo={(f) => void handleUpload('logo', f)}
          onLogoClear={() => void handleLogoClear()}
        />
      )}
      {activeTab === 'payment' && (
        <PaymentTab form={form} update={update} />
      )}
      {activeTab === 'defaults' && (
        <DefaultsTab form={form} update={update} />
      )}
      {activeTab === 'billing' && (
        <BillingTab />
      )}

      {/* ── Sticky save footer (always visible) ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm transition-colors ${isDirty ? 'border-blue-200 bg-blue-50/95' : 'border-slate-200'}`}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {isDirty
              ? <span className="font-medium text-blue-700">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
              : <span className="text-slate-400">การตั้งค่าทั้งหมดบันทึกแล้ว</span>
            }
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={() => setForm(savedForm)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || activeTab === 'billing'}
              className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                  </svg>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Check size={14} />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 1: Company Profile ───────────────────────────────────────────────────

function CompanyTab({
  form,
  update,
}: {
  form: FormState
  update: (p: Partial<FormState>) => void
}) {
  function text(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update({ [field]: e.target.value } as Partial<FormState>)
  }
  return (
    <div className="space-y-5">
      <SectionCard title="ข้อมูลบริษัท" icon={<Building2 size={15} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="ชื่อบริษัท / ร้านค้า">
            <input
              value={form.company_name}
              onChange={text('company_name')}
              placeholder="บริษัท ตัวอย่าง จำกัด"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="เลขประจำตัวผู้เสียภาษี">
            <input
              value={form.tax_id}
              onChange={text('tax_id')}
              placeholder="0000000000000"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="เว็บไซต์" className="md:col-span-2">
            <input
              value={form.website}
              onChange={text('website')}
              placeholder="https://www.example.com"
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="ที่อยู่" icon={<MapPin size={15} />}>
        <Field label="ที่อยู่บริษัท">
          <textarea
            value={form.address}
            onChange={text('address')}
            placeholder="123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110"
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </Field>
      </SectionCard>

      <SectionCard title="ข้อมูลติดต่อ" icon={<Contact size={15} />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="เบอร์โทร">
            <input
              value={form.phone}
              onChange={text('phone')}
              placeholder="02-xxx-xxxx"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="อีเมล">
            <input
              value={form.email}
              onChange={text('email')}
              placeholder="info@company.com"
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Tab 2: Document Design ───────────────────────────────────────────────────

function DesignTab({
  form,
  update,
  uploadingLogo,
  onUploadLogo,
  onLogoClear,
}: {
  form: FormState
  update: (p: Partial<FormState>) => void
  uploadingLogo: boolean
  onUploadLogo: (f: File) => void
  onLogoClear: () => void
}) {
  const { user } = useAuth()
  const { plan, limits } = usePlan()
  const { confirm, pending: confirmPending, onConfirm, onCancel } = useConfirm()
  const [signatures, setSignatures] = useState<SavedSignature[]>([])
  const [sigLoading, setSigLoading] = useState(true)
  const [uploadingSig, setUploadingSig] = useState(false)
  const sigInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    listSignatures(user.id)
      .then(setSignatures)
      .catch(() => { /* silent */ })
      .finally(() => setSigLoading(false))
  }, [user])

  const sigLimit = isFinite(limits.signatures) ? limits.signatures : Infinity
  const atLimit = isFinite(sigLimit) && signatures.length >= sigLimit

  async function handleUploadSig(file: File) {
    if (!user) return
    setUploadingSig(true)
    try {
      const sig = await saveSignature(user.id, 'ลายเซ็น', file)
      setSignatures(prev => [...prev, sig])
      toast.success('เพิ่มลายเซ็นเรียบร้อย')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ'
      if (msg.includes('PLAN_LIMIT')) {
        toast.error(`แผน ${PLAN_LABELS[plan]} บันทึกได้สูงสุด ${isFinite(sigLimit) ? sigLimit : '∞'} ลายเซ็น`)
      } else {
        toast.error(msg)
      }
    } finally {
      setUploadingSig(false)
    }
  }

  async function handleDeleteSig(sig: SavedSignature) {
    if (!user || !await confirm({ message: `ลายเซ็น "${sig.name}" จะถูกลบถาวร`, confirmLabel: 'ลบลายเซ็น', danger: true })) return
    try {
      await deleteSignature(sig.id, user.id)
      setSignatures(prev => prev.filter(s => s.id !== sig.id))
      toast.success('ลบลายเซ็นแล้ว')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  async function handleSetDefault(sig: SavedSignature) {
    if (!user) return
    try {
      await setDefaultSignature(user.id, sig.id)
      setSignatures(prev => prev.map(s => ({ ...s, is_default: s.id === sig.id })))
      toast.success(`ตั้ง "${sig.name}" เป็นลายเซ็นเริ่มต้น`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ไม่สำเร็จ')
    }
  }

  function text(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      update({ [field]: e.target.value } as Partial<FormState>)
  }

  return (
    <div className="space-y-5">
      {confirmPending && <ConfirmDialog {...confirmPending} onConfirm={onConfirm} onCancel={onCancel} />}
      {/* Image uploads */}
      <SectionCard title="รูปภาพบนเอกสาร" icon={<FileText size={15} />}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="โลโก้บริษัท">
            <p className="mb-2 text-xs text-slate-400">แสดงที่มุมบนซ้ายของเอกสาร</p>
            <ImageUploadField
              url={form.logo_url}
              uploading={uploadingLogo}
              onUpload={onUploadLogo}
              onClear={onLogoClear}
              buttonLabel="เลือกโลโก้"
            />
          </Field>
          <Field label="ลายเซ็นดิจิทัล (Default)">
            <p className="mb-2 text-xs text-slate-400">ลายเซ็นที่ใช้โดยอัตโนมัติในเอกสารใหม่</p>
            <div className="flex flex-col gap-2">
              {form.signature_url
                ? <img src={form.signature_url} alt="sig" className="h-14 object-contain rounded border border-slate-200 bg-white p-1" />
                : <div className="h-14 rounded border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-300">ยังไม่มีลายเซ็น</div>}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Signature manager */}
      <SectionCard title="จัดการลายเซ็น" icon={<FileText size={15} />}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400">
            {isFinite(sigLimit)
              ? `ใช้ ${signatures.length}/${sigLimit} ลายเซ็น — แผน ${PLAN_LABELS[plan]}`
              : `${signatures.length} ลายเซ็น — แผน ${PLAN_LABELS[plan]} (ไม่จำกัด)`}
          </p>
          <div className="flex items-center gap-2">
            {atLimit && (
              <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                ถึงขีดจำกัดแล้ว
              </span>
            )}
            <button
              type="button"
              disabled={atLimit || uploadingSig}
              onClick={() => sigInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingSig
                ? <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" /></svg>
                : <Upload size={12} />}
              เพิ่มลายเซ็น
            </button>
            <input ref={sigInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void handleUploadSig(f) }} />
          </div>
        </div>

        {sigLoading ? (
          <div className="flex justify-center py-6">
            <svg className="h-4 w-4 animate-spin text-slate-300" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
            </svg>
          </div>
        ) : signatures.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-100 flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-xs text-slate-300">ยังไม่มีลายเซ็นที่บันทึก</p>
            <p className="text-[10px] text-slate-300">คลิก "เพิ่มลายเซ็น" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {signatures.map(sig => (
              <div key={sig.id}
                className={`group relative rounded-lg border bg-white p-2 transition-all ${
                  sig.is_default ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
                }`}>
                {sig.is_default && (
                  <span className="absolute -top-2 left-2 flex items-center gap-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Star size={8} fill="white" />ค่าเริ่มต้น
                  </span>
                )}
                <img src={sig.url} alt={sig.name} className="h-12 w-full object-contain" />
                <p className="mt-1.5 truncate text-center text-[10px] text-slate-400">{sig.name}</p>
                <div className="mt-1.5 flex gap-1">
                  {!sig.is_default && (
                    <button type="button" onClick={() => void handleSetDefault(sig)}
                      title="ตั้งเป็น default"
                      className="flex-1 rounded border border-slate-200 py-1 text-[10px] text-slate-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors">
                      ตั้งเป็นหลัก
                    </button>
                  )}
                  <button type="button" onClick={() => void handleDeleteSig(sig)}
                    title="ลบ"
                    className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {atLimit && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-center gap-2">
            <Zap size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              อัพเกรดเป็น {plan === 'free' ? 'Pro (5 ลายเซ็น)' : 'Max (ไม่จำกัด)'} เพื่อเพิ่มลายเซ็นได้มากขึ้น
            </p>
          </div>
        )}
      </SectionCard>

      {/* Theme color */}
      <SectionCard title="สีธีมเอกสาร" icon={<FileText size={15} />}>
        <p className="mb-3 text-xs text-slate-400">
          ใช้เป็นสีพื้นหัวตาราง และ accent ในใบแจ้งหนี้ / ใบเสนอราคา
        </p>
        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ theme_color: c.value })}
              title={c.label}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all"
              style={{
                backgroundColor: c.value,
                borderColor: form.theme_color === c.value ? c.value : 'transparent',
                outline: form.theme_color === c.value ? `3px solid ${c.value}` : 'none',
                outlineOffset: '2px',
              }}
            >
              {form.theme_color === c.value && (
                <Check size={16} className="text-white drop-shadow" />
              )}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Document prefix */}
      <SectionCard title="รหัสนำหน้าเอกสาร (Prefix)" icon={<FileText size={15} />}>
        <p className="mb-3 text-xs text-slate-400">
          ระบบจะนำ Prefix ไปต่อกับเลขที่เอกสารให้อัตโนมัติ เช่น INV-2025-001
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ใบเสนอราคา (Quotation)">
            <input
              value={form.quotation_prefix}
              onChange={text('quotation_prefix')}
              placeholder="QT"
              maxLength={10}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ใบแจ้งหนี้ (Invoice)">
            <input
              value={form.invoice_prefix}
              onChange={text('invoice_prefix')}
              placeholder="INV"
              maxLength={10}
              className={INPUT_CLS}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              ตัวอย่าง:{' '}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-600">
                {form.invoice_prefix || 'INV'}-{new Date().getFullYear()}-001
              </span>
            </p>
          </Field>
          <Field label="ใบเสร็จรับเงิน (Receipt)">
            <input
              value={form.receipt_prefix}
              onChange={text('receipt_prefix')}
              placeholder="REC"
              maxLength={10}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ใบวางบิล (Billing Note)">
            <input
              value={form.billing_note_prefix}
              onChange={text('billing_note_prefix')}
              placeholder="BN"
              maxLength={10}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ใบกำกับภาษี (Tax Invoice)">
            <input
              value={form.tax_invoice_prefix}
              onChange={text('tax_invoice_prefix')}
              placeholder="TAX"
              maxLength={10}
              className={INPUT_CLS}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              ตัวอย่าง:{' '}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-600">
                {form.quotation_prefix || 'QT'}-{new Date().getFullYear()}-001
              </span>
            </p>
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Tab 3: Payment Methods ───────────────────────────────────────────────────

function PaymentTab({
  form,
  update,
}: {
  form: FormState
  update: (p: Partial<FormState>) => void
}) {
  function text(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update({ [field]: e.target.value } as Partial<FormState>)
  }
  return (
    <div className="space-y-5">
      <SectionCard title="บัญชีธนาคาร" icon={<CreditCard size={15} />}>
        <p className="mb-4 text-xs text-slate-400">
          ข้อมูลส่วนนี้จะแสดงที่ส่วนท้ายของใบแจ้งหนี้ เพื่อให้ลูกค้าโอนเงินได้ถูกต้อง
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="ชื่อธนาคาร">
            <select
              value={form.bank_name}
              onChange={e => update({ bank_name: e.target.value })}
              className={INPUT_CLS}
            >
              <option value="">— เลือกธนาคาร —</option>
              {THAI_BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="สาขา">
            <input
              value={form.bank_branch}
              onChange={text('bank_branch')}
              placeholder="สาขาสุขุมวิท"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ชื่อบัญชี">
            <input
              value={form.bank_account_name}
              onChange={text('bank_account_name')}
              placeholder="บริษัท ตัวอย่าง จำกัด"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="เลขที่บัญชี">
            <input
              value={form.bank_account_number}
              onChange={text('bank_account_number')}
              placeholder="xxx-x-xxxxx-x"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ข้อความเพิ่มเติม" className="md:col-span-2">
            <textarea
              value={form.bank_note}
              onChange={text('bank_note')}
              placeholder="หมายเหตุการชำระเงิน เช่น โอนแล้วแจ้งสลิป"
              rows={2}
              className={`${INPUT_CLS} resize-none`}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="PromptPay QR Code" icon={<CreditCard size={15} />}>
        <p className="mb-4 text-xs text-slate-400">
          ใส่เบอร์มือถือหรือเลขบัตรประชาชนที่ผูกกับ PromptPay เพื่อสร้าง QR Code อัตโนมัติท้ายบิล
        </p>
        <Field label="PromptPay ID (เบอร์มือถือ หรือ เลขประจำตัวประชาชน 13 หลัก)">
          <input
            value={form.promptpay_id}
            onChange={text('promptpay_id')}
            placeholder="08x-xxx-xxxx หรือ 0000000000000"
            className={INPUT_CLS}
          />
        </Field>
        {form.promptpay_id && (
          <p className="mt-2 text-xs text-green-600">
            ✓ QR Code จะแสดงท้ายเอกสารโดยอัตโนมัติเมื่อเพิ่ม Block &ldquo;ข้อมูลธนาคาร&rdquo;
          </p>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Tab 4: Defaults ─────────────────────────────────────────────────────────

function DefaultsTab({
  form,
  update,
}: {
  form: FormState
  update: (p: Partial<FormState>) => void
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="ค่าเริ่มต้นเอกสาร" icon={<Settings2 size={15} />}>
        <p className="mb-4 text-xs text-slate-400">
          ค่าเหล่านี้จะถูกดึงไปใส่อัตโนมัติทุกครั้งที่สร้างเอกสารใหม่ ประหยัดเวลาได้มาก
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ภาษีมูลค่าเพิ่ม (VAT)">
            <select
              value={form.vat_type}
              onChange={(e) => update({ vat_type: e.target.value })}
              className={INPUT_CLS}
            >
              {VAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="จำนวนวันครบกำหนดชำระ (Credit Terms)">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={365}
                value={form.credit_days}
                onChange={(e) => update({ credit_days: Number(e.target.value) })}
                className={`${INPUT_CLS} pr-12`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                วัน
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              เช่น กำหนด 30 วัน → วันครบกำหนดจะอยู่ห่างจากวันที่ออกเอกสาร 30 วัน
            </p>
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Tab 5: Billing ───────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual'

interface PlanFeature {
  text: string
  icon: React.ElementType
  muted?: boolean   // grayed-out "not included"
}

interface PlanDef {
  id: 'free' | 'pro' | 'business'
  name: string
  badge: string | null
  borderCls: string
  badgeCls: string
  features: PlanFeature[]
}

const PLAN_DEFS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    badge: null,
    borderCls: 'border-slate-200',
    badgeCls: '',
    features: [
      { text: 'เอกสาร 5 ใบ/เดือน (ทุกประเภท)', icon: FileText },
      { text: 'ลูกค้า & สินค้า อย่างละ 5 รายการ', icon: Users },
      { text: 'Dashboard แบบ Basic', icon: BarChart2 },
      { text: 'ลายเซ็นดิจิทัล 1 ลาย', icon: PenLine },
      { text: 'มี Watermark บนเอกสาร', icon: X, muted: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: '⭐ แนะนำสำหรับ Freelance',
    borderCls: 'border-blue-500',
    badgeCls: 'bg-blue-600 text-white',
    features: [
      { text: 'เอกสาร 100 ใบ/เดือน', icon: FileText },
      { text: 'ลูกค้า 50 ราย + สินค้า 50 รายการ', icon: Users },
      { text: 'ไม่มี Watermark', icon: ShieldCheck },
      { text: 'Dashboard PRO (กำไร, Cashflow, สต็อก)', icon: BarChart2 },
      { text: 'ลายเซ็นดิจิทัล 5 ลาย', icon: PenLine },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'สำหรับ SME',
    borderCls: 'border-violet-500',
    badgeCls: 'bg-violet-600 text-white',
    features: [
      { text: 'เอกสาร / ลูกค้า / สินค้า ไม่จำกัด', icon: Layers },
      { text: 'Export Excel (.xlsx)', icon: FileSpreadsheet },
      { text: 'Dashboard MAX (Forecast, Team)', icon: BarChart2 },
      { text: 'ลายเซ็นดิจิทัลไม่จำกัด', icon: PenLine },
      { text: 'Priority Support', icon: Zap },
    ],
  },
]

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct    = Math.min((used / limit) * 100, 100)
  const isNear = pct >= 80
  const isFull = pct >= 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className={isFull ? 'font-semibold text-red-500' : isNear ? 'font-semibold text-amber-500' : ''}>
          {used} / {isFinite(limit) ? limit : '∞'}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : isNear ? 'bg-amber-400' : 'bg-blue-500'}`}
          style={{ width: `${isFinite(limit) ? pct : 0}%` }}
        />
      </div>
    </div>
  )
}

type CheckoutTarget = { plan: 'pro' | 'business'; cycle: BillingCycle } | null

function BillingTab() {
  const { user }                = useAuth()
  const { plan, usage, loading } = usePlan()
  const [cycle, setCycle]       = useState<BillingCycle>('monthly')
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<CheckoutTarget>(null)

  useEffect(() => {
    if (!user || plan === 'free') return
    supabase
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('current_period_end', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.current_period_end) setPeriodEnd(data.current_period_end as string)
      })
  }, [user, plan])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-slate-100" />
        <div className="h-8 w-64 mx-auto rounded-full bg-slate-100" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    )
  }

  const limits = PLAN_LIMITS[plan]

  return (
    <div className="space-y-6">

      {/* ── Current plan banner ── */}
      <div className={`flex items-center justify-between rounded-2xl border p-5 ${
        plan === 'free'     ? 'border-slate-200 bg-white'
        : plan === 'pro'   ? 'border-blue-200 bg-blue-50'
        :                    'border-violet-200 bg-violet-50'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-800">{PLAN_LABELS[plan]}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              plan === 'free' ? 'bg-slate-100 text-slate-500'
              : plan === 'pro' ? 'bg-blue-100 text-blue-700'
              : 'bg-violet-100 text-violet-700'
            }`}>
              {plan === 'free' ? 'ฟรี' : 'Active'}
            </span>
          </div>
          {periodEnd
            ? <p className="mt-1 text-xs text-slate-500">
                ต่ออายุ {new Date(periodEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            : plan === 'free'
              ? <p className="mt-1 text-xs text-slate-400">อัปเกรดเพื่อปลดล็อกฟีเจอร์เพิ่มเติม</p>
              : null
          }
        </div>
        {plan !== 'free' && (
          <button
            onClick={() => toast.info('ระบบจัดการ subscription กำลังเปิดใช้เร็วๆ นี้')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            จัดการ Subscription
          </button>
        )}
      </div>

      {/* ── Usage bars ── */}
      <SectionCard title="การใช้งานเดือนนี้" icon={<BarChart2 size={15} />}>
        <div className="space-y-3">
          <UsageBar label="เอกสาร / เดือน" used={usage.docsThisMonth} limit={limits.docsPerMonth} />
          <UsageBar label="ลูกค้า (รวม)"   used={usage.totalCustomers}  limit={limits.customers}   />
          <UsageBar label="สินค้า (รวม)"   used={usage.totalProducts}   limit={limits.products}    />
        </div>
      </SectionCard>

      {/* ── Billing cycle toggle ── */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              cycle === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            รายเดือน
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              cycle === 'annual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            รายปี
            <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              -20%
            </span>
          </button>
        </div>
        {cycle === 'annual' && (
          <p className="text-xs text-green-600 font-medium">ชำระครั้งเดียวทั้งปี — ประหยัดสูงสุด ฿1,080</p>
        )}
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLAN_DEFS.map(p => {
          const isCurrent = p.id === plan
          const prices    = PLAN_PRICES[p.id]
          const price     = cycle === 'annual' ? prices.annual : prices.monthly

          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 transition-shadow ${
                isCurrent ? p.borderCls : 'border-slate-100'
              } ${p.id === 'pro' ? 'shadow-md shadow-blue-100' : 'shadow-sm'}`}
            >
              {/* Badge chips */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {isCurrent && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <CheckCircle2 size={9} /> แผนปัจจุบัน
                  </span>
                )}
                {p.badge && !isCurrent && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${p.badgeCls}`}>
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Plan name + price */}
              <p className="text-base font-bold text-slate-800">{p.name}</p>
              <div className="mt-1 mb-4">
                {price === 0 ? (
                  <span className="text-3xl font-extrabold text-slate-900">ฟรี</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">฿{price}</span>
                    <span className="mb-1 text-xs text-slate-400">/เดือน</span>
                  </div>
                )}
                {cycle === 'annual' && price > 0 && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ฿{price * 12} /ปี <span className="text-green-600 font-medium">(ประหยัด ฿{(prices.monthly - price) * 12})</span>
                  </p>
                )}
                {price === 0 && <p className="text-[11px] text-slate-400 mt-0.5">ตลอดไป</p>}
              </div>

              {/* Feature list */}
              <ul className="flex-1 space-y-2.5 mb-5">
                {p.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-xs ${f.muted ? 'text-slate-400' : 'text-slate-600'}`}>
                    <f.icon
                      size={13}
                      className={`mt-0.5 shrink-0 ${
                        f.muted ? 'text-slate-300'
                        : p.id === 'pro' ? 'text-blue-500'
                        : p.id === 'business' ? 'text-violet-500'
                        : 'text-slate-400'
                      }`}
                    />
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isCurrent ? (
                <div className="w-full rounded-xl border border-green-200 bg-green-50 py-2.5 text-center text-xs font-semibold text-green-600">
                  แผนปัจจุบันของคุณ
                </div>
              ) : p.id === 'free' ? (
                <div className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-xs text-slate-400">
                  —
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCheckout({ plan: p.id as 'pro' | 'business', cycle })}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${
                    p.id === 'pro'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'
                      : 'bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-200'
                  }`}
                >
                  อัปเกรดเป็น {p.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-slate-400">
        ทุกแผนสามารถยกเลิกได้ทุกเมื่อ · ข้อมูลปลอดภัยด้วย SSL Encryption
      </p>

      {/* Omise checkout modal */}
      {checkout && (
        <OmiseCheckoutModal
          plan={checkout.plan}
          cycle={checkout.cycle}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null)
            // Reload page to refresh plan state
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function ImageUploadField({
  url,
  uploading,
  onUpload,
  onClear,
  buttonLabel,
}: {
  url: string
  uploading: boolean
  onUpload: (file: File) => void
  onClear: () => void
  buttonLabel: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    // reset so same file can be re-uploaded if needed
    e.target.value = ''
  }

  if (url) {
    return (
      <div className="relative inline-flex">
        <img
          src={url}
          alt={buttonLabel}
          className="h-20 max-w-[200px] rounded-lg border border-slate-200 object-contain p-1.5"
        />
        <button
          type="button"
          onClick={onClear}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
        >
          <X size={11} />
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
          </svg>
        ) : (
          <Upload size={15} />
        )}
        {uploading ? 'กำลังอัปโหลด...' : buttonLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse p-6 md:p-10">
      <div className="mb-6 h-7 w-24 rounded bg-slate-200" />
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 flex-1 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 h-4 w-32 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="h-10 rounded bg-slate-100" />
              <div className="h-10 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
