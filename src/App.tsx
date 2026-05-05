import { useReducer, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { PdfModeContext } from './components/InvoiceDocument'
import InvoiceDocument from './components/InvoiceDocument'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { documentReducer, defaultDocument } from './store/documentStore'
import { useExportPdf } from './hooks/useExportPdf'
import { useAutoSave, loadDraft, loadCatalog } from './hooks/useAutoSave'
import { normalizeDocumentDraft, stripEphemeralBlobUrls } from './utils/documentDraft'
import { validateDocumentForExport } from './utils/validateExport'
import { BLOCK_CATALOG } from './types/document'
import type { BlockType } from './types/document'

// โหลด draft จาก localStorage ถ้ามี ไม่งั้นใช้ default
function getInitialDoc() {
  try {
    const draft = loadDraft()
    if (draft) return stripEphemeralBlobUrls(normalizeDocumentDraft(draft))
  } catch {
    void 0 /* draft ใน localStorage เสียหาย */
  }
  return defaultDocument
}

export default function App() {
  const [doc, dispatch] = useReducer(documentReducer, undefined, getInitialDoc)
  const [isPreview, setIsPreview] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const { docRef, exportPdf, isExporting, pdfMode } = useExportPdf()
  const saveStatus = useAutoSave(doc)
  const catalog = loadCatalog()

  const displayPdfMode = pdfMode || isPreview

  const outerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragStart(e: DragStartEvent) {
    setActiveDragId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveDragId(null)
    const activeId = String(active.id)

    if (activeId.startsWith('palette:')) {
      if (over) dispatch({ type: 'ADD_BLOCK', blockType: activeId.slice(8) as BlockType })
      return
    }

    // Block reorder
    if (over && active.id !== over.id) {
      const oldIdx = doc.blocks.findIndex(b => b.id === active.id)
      const newIdx = doc.blocks.findIndex(b => b.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1) {
        const ids = arrayMove(doc.blocks, oldIdx, newIdx).map(b => b.id)
        dispatch({ type: 'REORDER_BLOCKS', ids })
      }
    }
  }

  // Label shown in DragOverlay
  const dragLabel = activeDragId?.startsWith('palette:')
    ? BLOCK_CATALOG.find(c => c.type === activeDragId.slice(8))?.label ?? ''
    : doc.blocks.find(b => b.id === activeDragId)
        ? BLOCK_CATALOG.find(c => c.type === doc.blocks.find(b => b.id === activeDragId)?.type)?.label ?? ''
        : ''

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
        />

        <main className="flex-1 overflow-y-auto overflow-x-auto p-6">
          {/* กล่องนี้กำหนด width = 794px (A4) เสมอ ทำให้ layout ถูกต้องทั้งใน UI และตอน export */}
          <div style={{ width: '794px', margin: '0 auto' }}>
            {/* Preview mode banner */}
            {isPreview && (
              <div className="mb-3 flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
                <span className="font-medium">โหมดดูตัวอย่าง — นี่คือหน้าตาที่จะปรากฏใน PDF</span>
                <button onClick={() => setIsPreview(false)}
                  className="rounded px-2 py-0.5 hover:bg-amber-100 text-xs font-medium">
                  ปิด
                </button>
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
