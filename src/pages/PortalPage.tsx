import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, QrCode, X, RefreshCw } from 'lucide-react'
import {
  getPortalData,
  createPayment,
  checkPayment,
  type PortalData,
  type PortalDocument,
  type PaymentCharge,
} from '../lib/portalApi'

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation:    'ใบเสนอราคา',
  invoice:      'ใบแจ้งหนี้',
  receipt:      'ใบเสร็จรับเงิน',
  'billing-note': 'ใบวางบิล',
  'tax-invoice':  'ใบกำกับภาษี',
}

const STATUS_CONFIG = {
  draft:     { label: 'ร่าง',       color: 'bg-slate-100 text-slate-500' },
  sent:      { label: 'รอชำระ',     color: 'bg-amber-100 text-amber-700' },
  overdue:   { label: 'เกินกำหนด', color: 'bg-red-100 text-red-600' },
  paid:      { label: 'ชำระแล้ว',  color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก',     color: 'bg-slate-100 text-slate-400' },
} as const

function fmt(amount: number) {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── QR Payment Modal ─────────────────────────────────────────────────────────

interface QrModalProps {
  doc: PortalDocument
  token: string
  onClose: () => void
  onPaid: (docId: string) => void
}

function QrModal({ doc, token, onClose, onPaid }: QrModalProps) {
  const [charge, setCharge] = useState<PaymentCharge | null>(null)
  const [status, setStatus] = useState<'loading' | 'qr' | 'paid' | 'failed' | 'expired'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(900)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    void initPayment()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function initPayment() {
    const result = await createPayment(token, doc.id, doc.total_amount)
    if ('error' in result) {
      setError(result.error)
      setStatus('failed')
      return
    }
    setCharge(result.data)
    setStatus('qr')
    startPolling(result.data.charge_id)
    startTimer()
  }

  function startPolling(chargeId: string) {
    pollRef.current = setInterval(async () => {
      const s = await checkPayment(chargeId, doc.id, token)
      if (s === 'successful') {
        clearInterval(pollRef.current!)
        clearInterval(timerRef.current!)
        setStatus('paid')
        onPaid(doc.id)
      } else if (s === 'failed' || s === 'expired') {
        clearInterval(pollRef.current!)
        clearInterval(timerRef.current!)
        setStatus(s)
      }
    }, 3000)
  }

  function startTimer() {
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          clearInterval(pollRef.current!)
          setStatus('expired')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 pb-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">ชำระเงินด้วย PromptPay</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <RefreshCw size={24} className="animate-spin text-blue-500" />
              <p className="text-sm text-slate-500">กำลังสร้าง QR Code...</p>
            </div>
          )}

          {status === 'qr' && charge && (
            <div className="flex flex-col items-center">
              <p className="mb-1 text-xs text-slate-500">ยอดชำระ</p>
              <p className="mb-4 text-2xl font-bold text-slate-900">฿{fmt(charge.amount)}</p>
              {charge.qr_uri ? (
                <img src={charge.qr_uri} alt="PromptPay QR" className="mb-4 h-48 w-48 rounded-xl" />
              ) : (
                <div className="mb-4 flex h-48 w-48 items-center justify-center rounded-xl bg-slate-100">
                  <p className="text-xs text-slate-400">ไม่สามารถโหลด QR ได้</p>
                </div>
              )}
              <p className="mb-1 text-xs text-slate-400">หมดอายุใน</p>
              <p className="text-lg font-mono font-semibold text-amber-600">{mins}:{secs}</p>
              <p className="mt-4 text-center text-xs text-slate-400">
                สแกน QR ด้วยแอปธนาคาร · ระบบจะอัปเดตอัตโนมัติหลังชำระ
              </p>
            </div>
          )}

          {status === 'paid' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <p className="text-base font-semibold text-slate-800">ชำระเงินสำเร็จ</p>
              <p className="text-sm text-slate-500">ขอบคุณที่ชำระเงิน</p>
            </div>
          )}

          {(status === 'failed' || status === 'expired') && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <XCircle size={28} className="text-red-500" />
              </div>
              <p className="text-base font-semibold text-slate-800">
                {status === 'expired' ? 'QR หมดอายุ' : 'ชำระเงินไม่สำเร็จ'}
              </p>
              {error && <p className="text-xs text-slate-400">{error}</p>}
              <button
                onClick={() => { setStatus('loading'); setError(null); setSecondsLeft(900); void initPayment() }}
                className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: PortalDocument
  token: string
  onPaid: (id: string) => void
}

function DocCard({ doc, token, onPaid }: DocCardProps) {
  const [showQr, setShowQr] = useState(false)
  const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft
  const canPay = doc.status === 'sent' || doc.status === 'overdue'

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <FileText size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {doc.doc_number ?? '—'}
              </p>
              <p className="text-xs text-slate-400">{DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-400">
              {doc.due_date ? (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  ครบกำหนด {fmtDate(doc.due_date)}
                </span>
              ) : (
                <span>{fmtDate(doc.created_at)}</span>
              )}
            </p>
          </div>
          <p className="text-base font-bold text-slate-900">฿{fmt(doc.total_amount)}</p>
        </div>

        {canPay && (
          <button
            onClick={() => setShowQr(true)}
            className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            ชำระเงิน
          </button>
        )}

        {doc.status === 'paid' && doc.paid_date && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
            <CheckCircle2 size={13} />
            ชำระแล้ว {fmtDate(doc.paid_date)}
          </div>
        )}
      </div>

      {showQr && (
        <QrModal
          doc={doc}
          token={token}
          onClose={() => setShowQr(false)}
          onPaid={(id) => { onPaid(id); setShowQr(false) }}
        />
      )}
    </>
  )
}

// ─── Portal Page ──────────────────────────────────────────────────────────────

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()
  const [portal, setPortal] = useState<PortalData | null>(null)
  const [errorType, setErrorType] = useState<'invalid_token' | 'token_expired' | 'not_found' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setErrorType('invalid_token'); setLoading(false); return }
    void load(token)
  }, [token])

  async function load(t: string) {
    const result = await getPortalData(t)
    if ('error' in result) {
      setErrorType(result.error)
    } else {
      setPortal(result.data)
    }
    setLoading(false)
  }

  function handlePaid(docId: string) {
    setPortal(prev => {
      if (!prev) return prev
      return {
        ...prev,
        documents: prev.documents.map(d =>
          d.id === docId
            ? { ...d, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }
            : d,
        ),
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (errorType) {
    const msg = {
      invalid_token: 'ลิงก์นี้ไม่ถูกต้องหรือถูกยกเลิกแล้ว',
      token_expired: 'ลิงก์นี้หมดอายุแล้ว กรุณาขอลิงก์ใหม่จากผู้ออกบิล',
      not_found:     'ไม่พบข้อมูล กรุณาลองใหม่อีกครั้ง',
    }[errorType]
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertCircle size={26} className="text-red-500" />
        </div>
        <p className="text-base font-semibold text-slate-800">ไม่สามารถเข้าถึงได้</p>
        <p className="mt-1 text-sm text-slate-500">{msg}</p>
      </div>
    )
  }

  if (!portal) return null

  const pendingDocs  = portal.documents.filter(d => d.status === 'sent' || d.status === 'overdue')
  const otherDocs    = portal.documents.filter(d => d.status !== 'sent' && d.status !== 'overdue')
  const pendingTotal = pendingDocs.reduce((s, d) => s + d.total_amount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          {portal.company.logo_url ? (
            <img src={portal.company.logo_url} alt="logo" className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <FileText size={15} className="text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-800">
            {portal.company.company_name ?? 'BillBlock'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Customer info */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">บัญชีลูกค้า</p>
          <p className="text-xl font-bold text-slate-900">{portal.customer.name}</p>
          {portal.customer.email && (
            <p className="mt-0.5 text-sm text-slate-500">{portal.customer.email}</p>
          )}
        </div>

        {/* Pending summary */}
        {pendingDocs.length > 0 && (
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">ยอดค้างชำระ</p>
            <p className="text-3xl font-bold">฿{fmt(pendingTotal)}</p>
            <p className="mt-1 text-sm text-blue-200">{pendingDocs.length} รายการรอชำระ</p>
          </div>
        )}

        {/* Pending docs */}
        {pendingDocs.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">รอชำระ</p>
            <div className="space-y-3">
              {pendingDocs.map(doc => (
                <DocCard key={doc.id} doc={doc} token={token!} onPaid={handlePaid} />
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {otherDocs.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">ประวัติ</p>
            <div className="space-y-3">
              {otherDocs.map(doc => (
                <DocCard key={doc.id} doc={doc} token={token!} onPaid={handlePaid} />
              ))}
            </div>
          </section>
        )}

        {portal.documents.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <FileText size={28} className="mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">ยังไม่มีเอกสาร</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">
          Powered by BillBlock
        </p>
      </main>
    </div>
  )
}
