import { useEffect, useState } from 'react'
import { Building2, Contact, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type ProfileForm = {
  companyName: string
  taxId: string
  address: string
  phone: string
  email: string
}

const EMPTY_FORM: ProfileForm = {
  companyName: '',
  taxId: '',
  address: '',
  phone: '',
  email: '',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!user?.id) {
        if (active) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, tax_id, address, phone, email')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        toast.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
        setLoading(false)
        return
      }

      if (isRecord(data)) {
        setForm({
          companyName: toStringOrEmpty(data.company_name),
          taxId: toStringOrEmpty(data.tax_id),
          address: toStringOrEmpty(data.address),
          phone: toStringOrEmpty(data.phone),
          email: toStringOrEmpty(data.email) || user.email || '',
        })
      } else {
        setForm((prev) => ({ ...prev, email: user.email || prev.email }))
      }
      setLoading(false)
    }

    void loadProfile()
    return () => {
      active = false
    }
  }, [user?.id, user?.email])

  async function handleSave() {
    if (!user?.id || saving) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          company_name: form.companyName,
          tax_id: form.taxId,
          address: form.address,
          phone: form.phone,
          email: form.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )

    if (error) {
      toast.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
      setSaving(false)
      return
    }

    toast.success('บันทึกข้อมูลเรียบร้อยแล้ว')
    setSaving(false)
  }

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ตั้งค่าบริษัท</h1>

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 size={16} />
              ข้อมูลบริษัท
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="ชื่อบริษัท">
                <input
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                  placeholder="บริษัท ตัวอย่าง จำกัด"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <input
                  value={form.taxId}
                  onChange={(event) => updateField('taxId', event.target.value)}
                  placeholder="0000000000000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} />
              ที่อยู่
            </div>
            <Field label="ที่อยู่บริษัท">
              <textarea
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="123 ถนนสุขุมวิท กรุงเทพฯ"
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </Field>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Contact size={16} />
              ข้อมูลติดต่อ
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="เบอร์โทร">
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="02-xxx-xxxx"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
              <Field label="อีเมล">
                <input
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="info@company.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
            </div>
          </section>

          <div className="pt-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: themeColor }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 h-4 w-40 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="h-10 rounded bg-slate-100" />
            <div className="h-10 rounded bg-slate-100" />
          </div>
        </div>
      ))}
      <div className="h-10 w-32 rounded bg-slate-200" />
    </div>
  )
}
