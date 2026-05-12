import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile, uploadCompanyFile } from '../lib/profileApi'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function QuickSetupModal({ onClose, onSaved }: Props) {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    if (!user || !companyName.trim()) return
    setSaving(true)
    try {
      let logo_url = ''
      if (logoFile) {
        logo_url = await uploadCompanyFile(user.id, 'logo', logoFile)
      }
      const existing = await getProfile(user.id)
      await upsertProfile({
        id: user.id,
        company_name: companyName.trim(),
        tax_id: taxId.trim(),
        logo_url: logo_url || existing?.logo_url || '',
        address: existing?.address ?? '',
        phone: existing?.phone ?? '',
        email: existing?.email ?? '',
        website: existing?.website ?? '',
        signature_url: existing?.signature_url ?? '',
        theme_color: existing?.theme_color ?? '#1e3a8a',
        invoice_prefix: existing?.invoice_prefix ?? 'INV',
        quotation_prefix: existing?.quotation_prefix ?? 'QT',
        receipt_prefix: existing?.receipt_prefix ?? 'REC',
        billing_note_prefix: existing?.billing_note_prefix ?? 'BN',
        tax_invoice_prefix: existing?.tax_invoice_prefix ?? 'TAX',
        bank_name: existing?.bank_name ?? '',
        bank_branch: existing?.bank_branch ?? '',
        bank_account_name: existing?.bank_account_name ?? '',
        bank_account_number: existing?.bank_account_number ?? '',
        bank_note: existing?.bank_note ?? '',
        promptpay_id: existing?.promptpay_id ?? '',
        vat_type: existing?.vat_type ?? 'none',
        credit_days: existing?.credit_days ?? 30,
      })
      toast.success('บันทึกข้อมูลบริษัทเรียบร้อย')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-bold text-slate-800">ข้อมูลบริษัท</h2>
        <p className="mt-1 text-sm text-slate-500">
          ชื่อนี้จะปรากฏบนเอกสารทุกฉบับที่ออก
        </p>

        <div className="mt-5 space-y-4">
          {/* Company name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ชื่อบริษัท / ชื่อร้าน <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && companyName.trim()) void handleSave() }}
              placeholder="บริษัท ตัวอย่าง จำกัด"
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <input
              type="text"
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              placeholder="0000000000000"
              maxLength={13}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              โลโก้บริษัท
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              {logoPreview
                ? <img src={logoPreview} alt="logo preview" className="h-12 w-12 shrink-0 rounded-lg object-contain bg-slate-50" />
                : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Upload size={18} className="text-slate-400" />
                  </div>
                )
              }
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">
                  {logoFile ? logoFile.name : 'คลิกเพื่อเลือกรูปโลโก้'}
                </p>
                <p className="text-[11px] text-slate-400">PNG, JPG · ขนาดไม่เกิน 2MB</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ข้ามก่อน
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !companyName.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
