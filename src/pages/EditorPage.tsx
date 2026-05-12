import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import ConfirmDialog from '../components/ConfirmDialog'
import { useConfirm } from '../hooks/useConfirm'
import { PdfModeContext } from '../components/InvoiceDocument'
import InvoiceDocument from '../components/InvoiceDocument'
import RightPanel from '../components/RightPanel'
import { documentReducer, defaultDocument } from '../store/documentStore'
import { useExportPdf } from '../hooks/useExportPdf'
import { useAutoSave, loadDraft, loadCatalog } from '../hooks/useAutoSave'
import { normalizeDocumentDraft, stripEphemeralBlobUrls } from '../utils/documentDraft'
import { validateDocumentForExport } from '../utils/validateExport'
import { BLOCK_CATALOG } from '../types/document'
import type { BlockType, DocumentData } from '../types/document'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useCloudAutoSave } from '../hooks/useCloudAutoSave'
import { createDocument, updateDocument, convertToInvoice, convertToReceipt, convertToTaxInvoice } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'
import type { DocTypeCode } from '../types/document'
import { thaiToDocTypeCode } from '../types/document'
import { getProfile, upsertProfile, uploadCompanyFile } from '../lib/profileApi'
import { listSignatures, saveSignature } from '../lib/signatureApi'
import type { SavedSignature } from '../lib/signatureApi'
import { usePlanContext } from '../context/PlanContext'
import { EditorCallbacksContext } from '../context/EditorCallbacksContext'
import { PlanLimitError, PLAN_LABELS } from '../lib/planLimits'

const DOC_TYPE_ROUTE: Record<DocTypeCode, string> = {
  quotation:      '/documents/quotations',
  invoice:        '/documents/invoices',
  receipt:        '/documents/receipts',
  'billing-note': '/documents/billing-notes',
  'tax-invoice':  '/documents/tax-invoices',
  'credit-note':  '/documents/credit-notes',
}
import { listCustomers, createCustomer, type CustomerRow } from '../lib/customerApi'
import { listProducts, type ProductRow } from '../lib/productApi'

function getLocalDraftOrDefault() {
  try {
    const draft = loadDraft()
    if (draft) return stripEphemeralBlobUrls(normalizeDocumentDraft(draft))
  } catch { void 0 }
  return defaultDocument
}

const VALID_DOC_TYPES = new Set<string>(['quotation', 'invoice', 'receipt', 'billing-note', 'tax-invoice'])

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doc, dispatch] = useReducer(
    documentReducer,
    undefined,
    () => (id === 'local' ? getLocalDraftOrDefault() : defaultDocument),
  )
  const [docLoading, setDocLoading] = useState(id !== 'local')
  const [docError, setDocError] = useState('')

  const latestDocRef = useRef(doc)
  latestDocRef.current = doc

  // ─── โหลดจาก Supabase + auto-fill profile ────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (id === 'new') {
      if (!user) return
      const typeParam = searchParams.get('type')
      const docType = (typeParam && VALID_DOC_TYPES.has(typeParam) ? typeParam : 'quotation') as DocTypeCode
      async function createAndRedirect() {
        try {
          const newId = await createDocument(user!.id, docType)
          navigate(`/editor/${newId}`, { replace: true })
        } catch {
          toast.error('สร้างเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
          navigate(-1)
        }
      }
      void createAndRedirect()
      return
    }
    if (id === 'local') return

    async function loadFromCloud() {
      setDocLoading(true)
      setDocError('')
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('content')
          .eq('id', id)
          .eq('user_id', user!.id)
          .single()

        if (error) throw error

        if (data?.content) {
          // Normalize ข้อมูลที่โหลดมาเพื่อให้แน่ใจว่ามีโครงสร้างครบถ้วนตามที่ Component คาดหวัง
          let loaded = normalizeDocumentDraft(
            data.content as unknown as DocumentData
          )

          // ถ้าข้อมูลบริษัทยังเป็น placeholder (เอกสารใหม่) ให้ดึง profile มาใส่อัตโนมัติ
          if (loaded.company.name === defaultDocument.company.name && user) {
            try {
              const profile = await getProfile(user.id)
              if (profile) {
                loaded = {
                  ...loaded,
                  company: {
                    ...loaded.company,
                    name: profile.company_name || loaded.company.name,
                    address: profile.address || loaded.company.address,
                    phone: profile.phone || loaded.company.phone,
                    email: profile.email || loaded.company.email,
                    taxId: profile.tax_id || loaded.company.taxId,
                  },
                }
              }
            } catch { /* profile เป็น optional — ไม่ต้องแสดง error */ }
          }

          dispatch({ type: 'LOAD_DOCUMENT', doc: loaded })
        }
      } catch (err) {
        setDocError('ไม่สามารถเปิดเอกสารนี้ได้ในขณะนี้')
        toast.error('เปิดเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setDocLoading(false)
      }
    }

    void loadFromCloud()
  }, [id, user, searchParams, navigate])

  // ─── Loading / Error States ───────────────────────────────────────────────
  if (docLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">กำลังโหลดเอกสาร...</span>
      </div>
    </div>
  )

  if (docError) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="mb-2 font-medium text-slate-700">โหลดเอกสารไม่สำเร็จ</p>
        <p className="mb-4 text-sm text-slate-400">{docError}</p>
        <button onClick={() => navigate(-1)}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800">
          กลับ
        </button>
      </div>
    </div>
  )

  return (
    <EditorUI
      docId={id}
      doc={doc}
      dispatch={dispatch}
      latestDocRef={latestDocRef}
      isNewDoc={id === 'new' || searchParams.get('new') === '1'}
    />
  )
}

// ─── EditorUI ────────────────────────────────────────────────────────────────
function EditorUI({
  docId, doc, dispatch, latestDocRef, isNewDoc,
}: {
  docId: string | undefined
  doc: ReturnType<typeof documentReducer>
  dispatch: React.Dispatch<Parameters<typeof documentReducer>[1]>
  latestDocRef: React.RefObject<ReturnType<typeof documentReducer>>
  isNewDoc: boolean
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { plan, limits } = usePlanContext()
  const { confirm, pending: confirmPending, onConfirm, onCancel } = useConfirm()
  const [isPreview, setIsPreview] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([])

  // ─── Load saved signatures ────────────────────────────────────────────────
  const loadSignaturesForUser = useCallback(async () => {
    if (!user) return
    try {
      setSavedSignatures(await listSignatures(user.id))
    } catch { /* silent */ }
  }, [user])

  useEffect(() => { void loadSignaturesForUser() }, [loadSignaturesForUser])

  // ─── Auto-save logo to profile ────────────────────────────────────────────
  const handleLogoSave = useCallback((file: File) => {
    if (!user) return
    void (async () => {
      try {
        const url = await uploadCompanyFile(user.id, 'logo', file)
        const profile = await getProfile(user.id)
        if (profile) await upsertProfile({ ...profile, logo_url: url })
      } catch { /* non-critical */ }
    })()
  }, [user])

  // ─── Auto-save signature to profile + signatures table ───────────────────
  const handleSignatureSave = useCallback((file: File) => {
    if (!user) return
    void (async () => {
      try {
        const sig = await saveSignature(user.id, 'ลายเซ็น', file)
        setSavedSignatures(prev => [...prev, sig])
      } catch (err) {
        if (err instanceof PlanLimitError) {
          const planLabel = PLAN_LABELS[plan]
          const lim = limits.signatures
          toast.info(`แผน ${planLabel}: บันทึกลายเซ็นได้สูงสุด ${isFinite(lim) ? lim : '∞'} รายการ — อัพเกรดเพื่อเพิ่ม`)
        }
      }
    })()
  }, [user, plan, limits.signatures])

  const isCloudDoc = !!docId && docId !== 'new' && docId !== 'local'

  const { docRef, exportPdf, isExporting, pdfMode } = useExportPdf()
  const localSaveStatus = useAutoSave(isCloudDoc ? null : doc)
  const cloudSaveStatus = useCloudAutoSave(isCloudDoc ? docId : undefined, doc)
  const saveStatus = isCloudDoc ? cloudSaveStatus : localSaveStatus
  const [catalog] = useState(() => loadCatalog())

  useEffect(() => {
    if (!user) return
    async function loadMasterData() {
      try {
        const [customersData, productsData] = await Promise.all([listCustomers(), listProducts()])
        setCustomers(customersData)
        setProducts(productsData)
      } catch {
        toast.error('โหลดข้อมูลลูกค้า/สินค้าไม่สำเร็จ')
      }
    }
    void loadMasterData()
  }, [user])

  // ─── isDirty tracking ────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const isFirstDocChange = useRef(true)

  useEffect(() => {
    if (isFirstDocChange.current) { isFirstDocChange.current = false; return }
    setIsDirty(true)
  }, [doc])

  // auto-save สำเร็จ → clear dirty (ข้อมูลปลอดภัยแล้ว)
  useEffect(() => {
    if (cloudSaveStatus === 'saved') setIsDirty(false)
  }, [cloudSaveStatus])

  // ─── Browser close / refresh guard ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && isCloudDoc) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isCloudDoc])

  // ─── Explicit save ────────────────────────────────────────────────────────
  const handleSave = useCallback(async (targetStatus: DocumentRow['status'] = 'draft') => {
    if (!docId || !isCloudDoc || isSaving) return
    setIsSaving(true)
    try {
      await updateDocument(docId, latestDocRef.current!, targetStatus)
      setIsDirty(false)
      const successMessage: Record<DocumentRow['status'], string> = {
        draft: 'บันทึก Draft แล้ว',
        sent: 'เรียบร้อย! บิลของคุณพร้อมส่งไปเก็บเงินแล้ว',
        paid: 'บันทึกการรับเงินเรียบร้อย',
        cancelled: 'ยกเลิกเอกสารแล้ว',
      }
      toast.success(successMessage[targetStatus])
    } catch {
      toast.error('บันทึกเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSaving(false)
    }
  }, [docId, isCloudDoc, isSaving, latestDocRef])

  const handleConvert = useCallback(async (targetType: 'invoice' | 'receipt' | 'tax-invoice') => {
    if (!docId || !isCloudDoc || !user || isConverting) return
    setIsConverting(true)
    try {
      await updateDocument(docId, latestDocRef.current!)
      let newId: string
      if (targetType === 'invoice') newId = await convertToInvoice(docId, user.id)
      else if (targetType === 'receipt') newId = await convertToReceipt(docId, user.id)
      else newId = await convertToTaxInvoice(docId, user.id)
      toast.success('แปลงเอกสารเรียบร้อย')
      navigate(`/editor/${newId}`)
    } catch {
      toast.error('แปลงเอกสารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsConverting(false)
    }
  }, [docId, isCloudDoc, user, isConverting, latestDocRef, navigate])

  const displayPdfMode = pdfMode || isPreview

  const outerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragId(String(e.active.id))
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    setActiveDragId(null)
    const activeId = String(active.id)

    if (activeId.startsWith('palette:')) {
      if (over) dispatch({ type: 'ADD_BLOCK', blockType: activeId.slice('palette:'.length) as BlockType })
      return
    }

    if (over && active.id !== over.id) {
      const blocks = latestDocRef.current!.blocks
      const oldIdx = blocks.findIndex(b => b.id === active.id)
      const newIdx = blocks.findIndex(b => b.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1) {
        dispatch({ type: 'REORDER_BLOCKS', ids: arrayMove(blocks, oldIdx, newIdx).map(b => b.id) })
      }
    }
  }, [dispatch, latestDocRef])

  const dragLabel = useMemo(() => {
    if (!activeDragId) return ''
    if (activeDragId.startsWith('palette:'))
      return BLOCK_CATALOG.find(c => c.type === activeDragId.slice('palette:'.length))?.label ?? ''
    const block = doc.blocks.find(b => b.id === activeDragId)
    return block ? (BLOCK_CATALOG.find(c => c.type === block.type)?.label ?? '') : ''
  }, [activeDragId, doc.blocks])

  function handleExportPdf() {
    const { ok, messages } = validateDocumentForExport(doc)
    if (!ok) {
      alert(`กรุณากรอกข้อมูลต่อไปนี้ก่อน Export PDF:\n\n• ${messages.join('\n• ')}`)
      return
    }
    void exportPdf('bill-block-document.pdf')
  }

  async function handleBack() {
    if (isDirty && isCloudDoc) {
      const ok = await confirm({ title: 'ออกโดยไม่บันทึก?', message: 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก การออกจากหน้านี้จะทำให้ข้อมูลสูญหาย', confirmLabel: 'ออกโดยไม่บันทึก', danger: true })
      if (!ok) return
    }
    const typeCode = thaiToDocTypeCode(doc.docMeta.documentType)
    navigate(DOC_TYPE_ROUTE[typeCode] ?? '/documents/quotations')
  }

  function handleOpenQuickAdd(name: string) {
    setQuickAddName(name)
    setQuickAddOpen(true)
  }

  async function handleQuickAddSubmit(name: string) {
    if (!user) return
    try {
      await createCustomer(user.id, {
        name, address: '', tax_id: '', email: '', phone: '',
        contact_person: '', status: 'active', tags: [],
        billing_address: '', shipping_address: '', credit_term: '', salesperson: '',
      })
      const updated = await listCustomers()
      setCustomers(updated)
      dispatch({ type: 'UPDATE_CUSTOMER', data: { name } })
      setQuickAddOpen(false)
      toast.success(`เพิ่มลูกค้า "${name}" เรียบร้อย`)
    } catch {
      toast.error('เพิ่มลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }

  const editorCallbacksValue = useMemo(() => ({
    onLogoSave: handleLogoSave,
    onSignatureSave: handleSignatureSave,
    savedSignatures,
    signatureLimit: isFinite(limits.signatures) ? limits.signatures : Infinity,
    signatureCount: savedSignatures.length,
    refreshSignatures: () => void loadSignaturesForUser(),
  }), [handleLogoSave, handleSignatureSave, savedSignatures, limits.signatures, loadSignaturesForUser])

  return (
    <EditorCallbacksContext.Provider value={editorCallbacksValue}>
    {confirmPending && <ConfirmDialog {...confirmPending} onConfirm={onConfirm} onCancel={onCancel} />}
    <DndContext sensors={outerSensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <PdfModeContext.Provider value={displayPdfMode}>
        <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
          {/* Top Action Bar */}
          <TopActionBar
            docType={doc.docMeta.documentType}
            docNumber={doc.docMeta.number}
            themeColor={doc.settings.themeColor}
            saveStatus={saveStatus}
            isDirty={isDirty && isCloudDoc}
            isPreview={isPreview}
            isExporting={isExporting}
            isSaving={isSaving}
            isConverting={isConverting}
            isCloudDoc={isCloudDoc}
            onBack={handleBack}
            onPreview={() => setIsPreview(p => !p)}
            onSaveDraft={isCloudDoc ? () => void handleSave('draft') : undefined}
            onSaveAndIssue={isCloudDoc ? () => void handleSave('sent') : undefined}
            onExportPdf={handleExportPdf}
            onConvert={isCloudDoc ? handleConvert : undefined}
          />

          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto overflow-x-auto p-6">
              <div style={{ width: '794px', margin: '0 auto' }}>
                {isPreview && (
                  <div className="mb-3 flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                    <span className="font-medium">โหมดดูตัวอย่าง — นี่คือหน้าตาที่จะปรากฏใน PDF</span>
                    <button onClick={() => setIsPreview(false)}
                      className="rounded px-2 py-0.5 hover:bg-amber-100 text-xs font-medium">ปิด</button>
                  </div>
                )}
                <div className="shadow-lg rounded-sm">
                  <InvoiceDocument doc={doc} dispatch={dispatch} docRef={docRef} catalog={catalog} customers={customers} products={products} onQuickAddCustomer={handleOpenQuickAdd} autoFocusCustomer={isNewDoc} />
                </div>
              </div>
            </main>

            <RightPanel doc={doc} dispatch={dispatch} />
          </div>
        </div>
      </PdfModeContext.Provider>
      <DragOverlay dropAnimation={null}>
        {activeDragId && dragLabel ? (
          <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-xl pointer-events-none"
            style={{ backgroundColor: doc.settings.themeColor, opacity: 0.92 }}>
            {dragLabel}
          </div>
        ) : null}
      </DragOverlay>

      {quickAddOpen && (
        <QuickAddCustomerModal
          initialName={quickAddName}
          themeColor={doc.settings.themeColor}
          onClose={() => setQuickAddOpen(false)}
          onSubmit={handleQuickAddSubmit}
        />
      )}
    </DndContext>
    </EditorCallbacksContext.Provider>
  )
}

// ─── Top Action Bar ───────────────────────────────────────────────────────────
function TopActionBar({
  docType, docNumber, themeColor, saveStatus, isDirty,
  isPreview, isExporting, isSaving, isConverting, isCloudDoc,
  onBack, onPreview, onSaveDraft, onSaveAndIssue, onExportPdf, onConvert,
}: {
  docType: string; docNumber: string; themeColor: string
  saveStatus: 'saved' | 'saving' | 'unsaved'; isDirty: boolean
  isPreview: boolean; isExporting: boolean; isSaving: boolean; isConverting: boolean; isCloudDoc: boolean
  onBack: () => void; onPreview: () => void
  onSaveDraft?: () => void; onSaveAndIssue?: () => void
  onExportPdf: () => void
  onConvert?: (target: 'invoice' | 'receipt' | 'tax-invoice') => void
}) {
  const [convertOpen, setConvertOpen] = useState(false)
  const convertRef = useRef<HTMLDivElement>(null)

  // close dropdown on outside click
  useEffect(() => {
    if (!convertOpen) return
    function handleOutside(e: MouseEvent) {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) {
        setConvertOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [convertOpen])

  const convertOptions: { target: 'invoice' | 'receipt' | 'tax-invoice'; label: string }[] =
    docType === 'ใบเสนอราคา'
      ? [
          { target: 'invoice',      label: '→ ใบแจ้งหนี้' },
          { target: 'receipt',      label: '→ ใบเสร็จรับเงิน' },
          { target: 'tax-invoice',  label: '→ ใบกำกับภาษี' },
        ]
      : docType === 'ใบแจ้งหนี้'
        ? [
            { target: 'receipt',     label: '→ ใบเสร็จรับเงิน' },
            { target: 'tax-invoice', label: '→ ใบกำกับภาษี' },
          ]
        : []
  return (
    <header className="flex h-13 items-center gap-2 border-b border-slate-200 bg-white px-4 shrink-0" style={{ height: '52px' }}>
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        เอกสาร
      </button>

      <div className="h-4 w-px bg-slate-200" />

      {/* Brand + Doc info */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: themeColor }}>
          <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sm font-bold text-slate-800">BillBlock</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{docType}</span>
        <span className="font-mono text-xs text-slate-400">{docNumber}</span>
      </div>

      <div className="flex-1" />

      {/* Save status */}
      <SaveStatus status={saveStatus} isDirty={isDirty} />

      <div className="h-4 w-px bg-slate-200" />

      {/* Preview */}
      <button onClick={onPreview}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors ${
          isPreview
            ? 'bg-amber-50 border-amber-300 text-amber-700'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}>
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {isPreview ? 'ออกจาก Preview' : 'Preview'}
      </button>

      {/* Save Draft */}
      {isCloudDoc && onSaveDraft && (
        <button onClick={onSaveDraft} disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
          {isSaving
            ? <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          }
          บันทึก Draft
        </button>
      )}

      {/* Convert */}
      {onConvert && convertOptions.length > 0 && (
        <div className="relative" ref={convertRef}>
          <button
            onClick={() => setConvertOpen(p => !p)}
            disabled={isConverting}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {isConverting
              ? <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            }
            {isConverting ? 'กำลังแปลง...' : 'แปลงเป็น'}
            {!isConverting && <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </button>
          {convertOpen && (
            <div className="absolute top-full right-0 mt-1 z-30 min-w-[160px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
              {convertOptions.map(opt => (
                <button
                  key={opt.target}
                  onClick={() => { setConvertOpen(false); void onConvert(opt.target) }}
                  className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issue */}
      {isCloudDoc && onSaveAndIssue && (
        <button onClick={onSaveAndIssue} disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: themeColor }}>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ออกเอกสาร
        </button>
      )}

      {/* Export PDF */}
      <button onClick={onExportPdf} disabled={isExporting}
        className="flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-semibold disabled:opacity-60 transition-colors hover:opacity-90"
        style={{ borderColor: themeColor, color: themeColor }}>
        {isExporting
          ? <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        }
        {isExporting ? 'กำลัง Export...' : 'Export PDF'}
      </button>

    </header>
  )
}

function SaveStatus({ status, isDirty }: { status: 'saved' | 'saving' | 'unsaved'; isDirty: boolean }) {
  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        กำลังบันทึก...
      </div>
    )
  }
  if (status === 'saved' && !isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-green-600">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        บันทึกแล้ว
      </div>
    )
  }
  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-500">
        <div className="h-2 w-2 rounded-full bg-amber-400" />
        มีการเปลี่ยนแปลง
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
      <div className="h-2 w-2 rounded-full bg-slate-200" />
      ยังไม่บันทึก
    </div>
  )
}

// ─── Quick Add Customer Modal ─────────────────────────────────────────────────
function QuickAddCustomerModal({
  initialName,
  themeColor,
  onClose,
  onSubmit,
}: {
  initialName: string
  themeColor: string
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSubmit(name.trim())
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-bold text-slate-800">เพิ่มลูกค้าใหม่</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">ชื่อลูกค้า / บริษัท <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              placeholder="เช่น บริษัท ABC จำกัด"
            />
          </div>
          <p className="text-xs text-slate-400">สามารถแก้ไขข้อมูลเพิ่มเติมได้ในหน้าลูกค้า</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              {saving ? 'กำลังเพิ่ม...' : 'เพิ่มลูกค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
