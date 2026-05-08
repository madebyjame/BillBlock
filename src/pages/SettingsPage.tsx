import type { ChangeEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Contact,
  CreditCard,
  FileText,
  MapPin,
  Settings2,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile, uploadCompanyFile } from '../lib/profileApi'
import type { Profile } from '../lib/profileApi'
import { usePlan } from '../hooks/usePlan'
import { PLAN_LABELS } from '../lib/planLimits'
import { supabase } from '../lib/supabase'

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

const VAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'none',     label: 'ไม่มี VAT' },
  { value: 'included', label: 'รวม VAT 7% ในราคา' },
  { value: 'excluded', label: 'แยก VAT 7% ออกจากราคา' },
]

const EMPTY_FORM: FormState = {
  company_name:       '',
  address:            '',
  tax_id:             '',
  phone:              '',
  email:              '',
  website:            '',
  logo_url:           '',
  signature_url:      '',
  theme_color:        '#1e3a8a',
  invoice_prefix:     'INV',
  quotation_prefix:   'QT',
  bank_name:          '',
  bank_branch:        '',
  bank_account_name:  '',
  bank_account_number: '',
  bank_note:          '',
  vat_type:           'none',
  credit_days:        30,
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('company')
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [savedForm, setSavedForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSig,  setUploadingSig]  = useState(false)

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
              invoice_prefix:      profile.invoice_prefix  || 'INV',
              quotation_prefix:    profile.quotation_prefix || 'QT',
              bank_name:           profile.bank_name,
              bank_branch:         profile.bank_branch,
              bank_account_name:   profile.bank_account_name,
              bank_account_number: profile.bank_account_number,
              bank_note:           profile.bank_note,
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

  async function handleUpload(type: 'logo' | 'signature', file: File) {
    if (!user) return
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingSig
    setUploading(true)
    try {
      const url = await uploadCompanyFile(user.id, type, file)
      update(type === 'logo' ? { logo_url: url } : { signature_url: url })
      toast.success(type === 'logo' ? 'อัปโหลดโลโก้เรียบร้อย' : 'อัปโหลดลายเซ็นเรียบร้อย')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!user || saving) return
    setSaving(true)
    try {
      await upsertProfile({ id: user.id, ...form })
      setSavedForm(form)
      toast.success('บันทึกการตั้งค่าเรียบร้อย', { id: 'settings-save' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="mx-auto max-w-4xl p-4 pb-36 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ตั้งค่า</h1>

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
          uploadingSig={uploadingSig}
          onUploadLogo={(f) => void handleUpload('logo', f)}
          onUploadSig={(f)  => void handleUpload('signature', f)}
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

      {/* ── Sticky save footer (shows only when dirty) ── */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <p className="text-sm text-slate-500">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(savedForm)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
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
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
  uploadingSig,
  onUploadLogo,
  onUploadSig,
}: {
  form: FormState
  update: (p: Partial<FormState>) => void
  uploadingLogo: boolean
  uploadingSig: boolean
  onUploadLogo: (f: File) => void
  onUploadSig: (f: File) => void
}) {
  function text(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      update({ [field]: e.target.value } as Partial<FormState>)
  }
  return (
    <div className="space-y-5">
      {/* Image uploads */}
      <SectionCard title="รูปภาพบนเอกสาร" icon={<FileText size={15} />}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="โลโก้บริษัท">
            <p className="mb-2 text-xs text-slate-400">แสดงที่มุมบนซ้ายของเอกสาร</p>
            <ImageUploadField
              url={form.logo_url}
              uploading={uploadingLogo}
              onUpload={onUploadLogo}
              onClear={() => update({ logo_url: '' })}
              buttonLabel="เลือกโลโก้"
            />
          </Field>
          <Field label="ลายเซ็นดิจิทัล">
            <p className="mb-2 text-xs text-slate-400">แสดงที่ช่องลงนามด้านล่างเอกสาร</p>
            <ImageUploadField
              url={form.signature_url}
              uploading={uploadingSig}
              onUpload={onUploadSig}
              onClear={() => update({ signature_url: '' })}
              buttonLabel="เลือกลายเซ็น"
            />
          </Field>
        </div>
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
          ระบบจะนำ Prefix ไปต่อกับเลขที่เอกสารให้อัตโนมัติ เช่น INV-2025-0001
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ใบแจ้งหนี้ (Invoice)">
            <input
              value={form.invoice_prefix}
              onChange={text('invoice_prefix')}
              placeholder="INV"
              maxLength={10}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="ใบเสนอราคา (Quotation)">
            <input
              value={form.quotation_prefix}
              onChange={text('quotation_prefix')}
              placeholder="QT"
              maxLength={10}
              className={INPUT_CLS}
            />
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
            <input
              value={form.bank_name}
              onChange={text('bank_name')}
              placeholder="ธนาคารกสิกรไทย"
              className={INPUT_CLS}
            />
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
              placeholder="พร้อมเพย์ 08x-xxx-xxxx หรือข้อความอื่นๆ"
              rows={2}
              className={`${INPUT_CLS} resize-none`}
            />
          </Field>
        </div>
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

const PLANS_INFO = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 'ฟรี',
    priceNote: 'ตลอดไป',
    features: ['เอกสาร 20 ฉบับ/เดือน', 'ลูกค้า 10 ราย', 'สินค้า 10 รายการ', 'PDF export'],
    color: 'border-slate-200',
    highlight: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '฿299',
    priceNote: '/เดือน',
    features: ['เอกสารไม่จำกัด', 'ลูกค้าไม่จำกัด', 'สินค้าไม่จำกัด', 'แดชบอร์ดขั้นสูง', 'ปรับแต่งธีม & โลโก้'],
    color: 'border-blue-500',
    highlight: true,
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '฿599',
    priceNote: '/เดือน',
    features: ['ทุกอย่างใน Pro', 'ผู้ใช้งานหลายคน (5 คน)', 'นำเข้า Excel', 'Priority Support'],
    color: 'border-violet-500',
    highlight: false,
  },
]

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isNear = pct >= 80
  const isFull = pct >= 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className={isFull ? 'font-semibold text-red-500' : isNear ? 'font-semibold text-amber-500' : ''}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : isNear ? 'bg-amber-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function BillingTab() {
  const { user } = useAuth()
  const { plan, usage, limits, loading } = usePlan()
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)

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
        <div className="h-28 rounded-xl bg-slate-100" />
        <div className="h-36 rounded-xl bg-slate-100" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-slate-100" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <SectionCard title="แผนปัจจุบัน" icon={<Zap size={15} />}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-slate-800">{PLAN_LABELS[plan]}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                plan === 'free' ? 'bg-slate-100 text-slate-500' :
                plan === 'pro'  ? 'bg-blue-100 text-blue-700' :
                                  'bg-violet-100 text-violet-700'
              }`}>
                {plan === 'free' ? 'ฟรี' : 'Active'}
              </span>
            </div>
            {periodEnd && (
              <p className="mt-1 text-xs text-slate-400">
                ต่ออายุ {new Date(periodEnd).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {plan === 'free' && (
              <p className="mt-1 text-xs text-slate-400">อัปเกรดเพื่อปลดล็อกฟีเจอร์เพิ่มเติม</p>
            )}
          </div>
          {plan !== 'free' && (
            <button
              onClick={() => toast.info('ระบบจัดการ subscription กำลังเปิดใช้เร็วๆ นี้')}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              จัดการ subscription
            </button>
          )}
        </div>
      </SectionCard>

      {/* Usage */}
      {plan === 'free' && (
        <SectionCard title="การใช้งานเดือนนี้" icon={<FileText size={15} />}>
          <div className="space-y-3">
            <UsageRow label="เอกสาร / เดือน" used={usage.docsThisMonth} limit={limits.docsPerMonth} />
            <UsageRow label="ลูกค้า"          used={usage.totalCustomers}  limit={limits.customers} />
            <UsageRow label="สินค้า"          used={usage.totalProducts}   limit={limits.products} />
          </div>
        </SectionCard>
      )}

      {/* Plan cards */}
      <SectionCard title="เปรียบเทียบแผน" icon={<CreditCard size={15} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS_INFO.map((p) => {
            const isCurrent = p.id === plan
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border-2 p-4 ${isCurrent ? p.color : 'border-slate-100'} ${p.highlight && !isCurrent ? 'bg-blue-50/40' : 'bg-white'}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <CheckCircle2 size={9} /> แผนปัจจุบัน
                  </div>
                )}
                <p className="font-bold text-slate-800">{p.name}</p>
                <div className="my-1 flex items-end gap-1">
                  <span className="text-xl font-extrabold text-slate-900">{p.price}</span>
                  <span className="mb-0.5 text-xs text-slate-400">{p.priceNote}</span>
                </div>
                <ul className="my-3 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check size={12} className="mt-0.5 shrink-0 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="mt-3 w-full rounded-lg border border-green-200 bg-green-50 py-2 text-center text-xs font-semibold text-green-600">
                    แผนปัจจุบัน
                  </div>
                ) : p.id === 'free' ? (
                  <div className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-center text-xs text-slate-400">
                    —
                  </div>
                ) : (
                  <button
                    onClick={() => toast.info('ระบบชำระเงินกำลังเปิดใช้เร็วๆ นี้')}
                    className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
                      p.id === 'pro'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    }`}
                  >
                    อัปเกรดเป็น {p.name}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>
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
    <div className="mx-auto max-w-4xl animate-pulse p-4 md:p-8">
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
