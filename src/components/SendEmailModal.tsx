import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, X, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface SendEmailModalProps {
  docNumber: string
  docTypeLabel: string
  customerEmail?: string
  customerName?: string
  companyName?: string
  portalUrl?: string
  onClose: () => void
}

export default function SendEmailModal({
  docNumber,
  docTypeLabel,
  customerEmail = '',
  customerName = '',
  companyName = '',
  portalUrl,
  onClose,
}: SendEmailModalProps) {
  const [to, setTo]           = useState(customerEmail)
  const [message, setMessage] = useState('')
  const [copied, setCopied]   = useState(false)

  const subject = `${docTypeLabel} ${docNumber}${companyName ? ` จาก ${companyName}` : ''}`

  const defaultBody = [
    customerName ? `เรียน คุณ${customerName}` : 'เรียน ลูกค้า',
    '',
    `ขอส่ง${docTypeLabel} ${docNumber} มาพร้อมกับอีเมลฉบับนี้`,
    message ? '' : undefined,
    message || undefined,
    '',
    portalUrl
      ? `สามารถดูเอกสารออนไลน์ได้ที่:\n${portalUrl}`
      : 'กรุณาดูเอกสารในไฟล์ที่แนบมา',
    '',
    companyName ? `ขอบคุณครับ/ค่ะ\n${companyName}` : 'ขอบคุณครับ/ค่ะ',
  ].filter(l => l !== undefined).join('\n')

  function openMailto() {
    if (!to) { toast.error('กรุณาระบุอีเมลผู้รับ'); return }
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(defaultBody)}`
    window.open(mailtoUrl, '_blank')
    toast.success('เปิด email client แล้ว')
    onClose()
  }

  async function copyLink() {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('คัดลอก portal link แล้ว')
    setTimeout(() => setCopied(false), 2000)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Mail size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">ส่งเอกสารทางอีเมล</p>
              <p className="text-xs text-slate-400">{docNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* To */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">ส่งถึง (อีเมลลูกค้า) *</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Subject preview */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">หัวข้ออีเมล</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {subject}
            </div>
          </div>

          {/* Optional message */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">ข้อความเพิ่มเติม (ไม่บังคับ)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="ข้อความพิเศษถึงลูกค้า..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Portal link */}
          {portalUrl && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Portal Link (จะแนบในอีเมล)</label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate">
                  {portalUrl}
                </div>
                <button onClick={() => void copyLink()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            ระบบจะเปิด email client ของคุณ (Gmail / Outlook) พร้อมข้อความที่เตรียมไว้ — คุณสามารถแก้ไขและแนบ PDF ก่อนส่งได้
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            ยกเลิก
          </button>
          <button onClick={openMailto}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500">
            <Mail size={14} />
            เปิด Email Client
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
