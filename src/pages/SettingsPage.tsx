import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../lib/profileApi'
import type { Profile } from '../lib/profileApi'

const EMPTY: Omit<Profile, 'id'> = { company_name: '', address: '', tax_id: '', phone: '', email: '' }

export default function SettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!user) return
    getProfile(user.id)
      .then(p => {
        if (p) setForm({ company_name: p.company_name ?? '', address: p.address ?? '', tax_id: p.tax_id ?? '', phone: p.phone ?? '', email: p.email ?? '' })
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [user])

  function set(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setSaved(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || saving) return
    setSaving(true)
    setError('')
    try {
      await upsertProfile({ id: user.id, ...form })
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">ตั้งค่าบริษัท</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">กำลังโหลด…</div>
      ) : (
        <form onSubmit={e => void handleSave(e)} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <Field label="ชื่อบริษัท" placeholder="บริษัท ตัวอย่าง จำกัด" value={form.company_name} onChange={set('company_name')} />
          <Field label="ที่อยู่" placeholder="123 ถนน..." value={form.address} onChange={set('address')} multiline />
          <Field label="เลขประจำตัวผู้เสียภาษี" placeholder="0000000000000" value={form.tax_id} onChange={set('tax_id')} />
          <Field label="เบอร์โทร" placeholder="02-xxx-xxxx" value={form.phone} onChange={set('phone')} />
          <Field label="อีเมล" placeholder="info@company.com" value={form.email} onChange={set('email')} type="email" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              บันทึกการตั้งค่า
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

function Field({ label, placeholder, value, onChange, multiline, type }: {
  label: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
  type?: string
}) {
  const cls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {multiline
        ? <textarea rows={2} placeholder={placeholder} value={value} onChange={onChange} className={cls} />
        : <input type={type ?? 'text'} placeholder={placeholder} value={value} onChange={onChange} className={cls} />
      }
    </div>
  )
}
