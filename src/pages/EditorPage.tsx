import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { PdfModeContext } from '../components/InvoiceDocument'
import InvoiceDocument from '../components/InvoiceDocument'
import LeftPanel from '../components/LeftPanel'
import RightPanel from '../components/RightPanel'
import { documentReducer, defaultDocument } from '../store/documentStore'
import { useExportPdf } from '../hooks/useExportPdf'
import { useAutoSave, loadDraft, loadCatalog } from '../hooks/useAutoSave'
import { normalizeDocumentDraft, stripEphemeralBlobUrls } from '../utils/documentDraft'
import { validateDocumentForExport } from '../utils/validateExport'
import { BLOCK_CATALOG } from '../types/document'
import type { BlockType } from '../types/document'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useCloudAutoSave } from '../hooks/useCloudAutoSave'
import { updateDocument } from '../lib/documentApi'
import type { DocumentRow } from '../lib/documentApi'
import { getProfile } from '../lib/profileApi'

function getLocalDraftOrDefault() {
  try {
    const draft = loadDraft()
    if (draft) return stripEphemeralBlobUrls(normalizeDocumentDraft(draft))
  } catch { void 0 }
  return defaultDocument
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()

  const [doc, dispatch] = useReducer(
    documentReducer,
    undefined,
    () => (id === 'local' ? getLocalDraftOrDefault() : defaultDocument),
  )
  const [docLoading, setDocLoading] = useState(id !== 'new' && id !== 'local')
  const [docError, setDocError] = useState('')

  const latestDocRef = useRef(doc)
  latestDocRef.current = doc

  // ─── โหลดจาก Supabase + auto-fill profile ────────────────────────────────
  useEffect(() => {
    if (!id || id === 'new' || id === 'local') return

    async function loadFromCloud() {
      setDocLoading(true)
      setDocError('')
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('content')
          .eq('id', id)
          .single()

        if (error) throw error

        if (data?.content) {
          let loaded = normalizeDocumentDraft(
            data.content as Parameters<typeof normalizeDocumentDraft>[0],
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
        const msg = err instanceof Error ? err.message : 'โหลดเอกสารไม่สำเร็จ'
        setDocError(msg)
      } finally {
        setDocLoading(false)
      }
    }

    void loadFromCloud()
  }, [id, user])

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
        <p className="text-red-500 font-medium mb-2">โหลดเอกสารไม่สำเร็จ</p>
        <p className="text-sm text-slate-400 mb-4">{docError}</p>
        <button onClick={() => navigate('/documents')}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800">
          กลับไปรายการเอกสาร
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
      signOut={signOut}
    />
  )
}

// ─── EditorUI ────────────────────────────────────────────────────────────────
function EditorUI({
  docId, doc, dispatch, latestDocRef, signOut,
}: {
  docId: string | undefined
  doc: ReturnType<typeof documentReducer>
  dispatch: React.Dispatch<Parameters<typeof documentReducer>[1]>
  latestDocRef: React.RefObject<ReturnType<typeof documentReducer>>
  signOut: () => Promise<void>
}) {
  const navigate = useNavigate()
  const [isPreview, setIsPreview] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isCloudDoc = !!docId && docId !== 'new' && docId !== 'local'

  const { docRef, exportPdf, isExporting, pdfMode } = useExportPdf()
  const localSaveStatus = useAutoSave(isCloudDoc ? null : doc)
  const cloudSaveStatus = useCloudAutoSave(isCloudDoc ? docId : undefined, doc)
  const saveStatus = isCloudDoc ? cloudSaveStatus : localSaveStatus
  const [catalog] = useState(() => loadCatalog())

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
      toast.success(targetStatus === 'draft' ? 'บันทึก Draft แล้ว' : 'ออกเอกสารแล้ว')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setIsSaving(false)
    }
  }, [docId, isCloudDoc, isSaving, latestDocRef])

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

  return (
    <DndContext sensors={outerSensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <PdfModeContext.Provider value={displayPdfMode}>
        <div className="flex h-screen overflow-hidden bg-slate-100">
          <LeftPanel
            onExportPdf={() => {
              const { ok, messages } = validateDocumentForExport(doc)
              if (!ok) {
                alert(`กรุณากรอกข้อมูลต่อไปนี้ก่อน Export PDF:\n\n• ${messages.join('\n• ')}`)
                return
              }
              void exportPdf('bill-block-document.pdf')
            }}
            isExporting={isExporting}
            onPreview={() => setIsPreview(p => !p)}
            isPreview={isPreview}
            saveStatus={saveStatus}
            themeColor={doc.settings.themeColor}
            onSignOut={signOut}
            onBack={() => {
              if (isDirty && isCloudDoc && !window.confirm('มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก\nต้องการออกจากหน้านี้หรือไม่?')) return
              navigate('/documents')
            }}
            isDirty={isDirty && isCloudDoc}
            isSaving={isSaving}
            onSaveDraft={isCloudDoc ? () => void handleSave('draft') : undefined}
            onSaveAndIssue={isCloudDoc ? () => void handleSave('sent') : undefined}
          />

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
                <InvoiceDocument doc={doc} dispatch={dispatch} docRef={docRef} catalog={catalog} />
              </div>
            </div>
          </main>

          <RightPanel doc={doc} dispatch={dispatch} />
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
    </DndContext>
  )
}
