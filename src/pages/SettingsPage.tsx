import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Building2, Contact, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../lib/profileApi'
import type { Profile } from '../lib/profileApi'

const EMPTY_FORM: Omit<Profile, 'id'> = {
  company_name: '',
  address: '',
  tax_id: '',
  phone: '',
  email: '',
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const themeColor = typeof user?.user_metadata?.themeColor === 'string'
    ? user.user_metadata.themeColor
    : '#1e3a8a'

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    getProfile(user.id)
      .then((profile) => {
        if (profile) {
          setForm({
            company_name: profile.company_name ?? '',
            address: profile.address ?? '',
            tax_id: profile.tax_id ?? '',
            phone: profile.phone ?? '',
            email: profile.email ?? user.email ?? '',
          })
        } else {
          setForm((prev) => ({ ...prev, email: user.email ?? prev.email }))
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => () => clearTimeout(savedTimer.current), [])

  function setField(field: keyof Omit<Profile, 'id'>) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      setSaved(false)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || saving) return

    setSaving(true)
    setError('')
    try {
      await upsertProfile({ id: user.id, ...form })
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ตั้งค่าบริษัท</h1>

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <form onSubmit={(event) => void handleSave(event)} className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Building2 size={16} />
              ข้อมูลบริษัท
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="ชื่อบริษัท">
                <input
                  value={form.company_name}
                  onChange={setField('company_name')}
                  placeholder="บริษัท ตัวอย่าง จำกัด"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <input
                  value={form.tax_id}
                  onChange={setField('tax_id')}
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
                onChange={setField('address')}
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
                  onChange={setField('phone')}
                  placeholder="02-xxx-xxxx"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
              <Field label="อีเมล">
                <input
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="info@company.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                />
              </Field>
            </div>
          </section>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: themeColor }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกแล้ว
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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
