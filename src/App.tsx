import { useReducer, useState } from 'react'
import { PdfModeContext } from './components/InvoiceDocument'
import InvoiceDocument from './components/InvoiceDocument'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { documentReducer, defaultDocument } from './store/documentStore'
import { useExportPdf } from './hooks/useExportPdf'
import { useAutoSave, loadDraft, loadCatalog } from './hooks/useAutoSave'
import { normalizeDocumentDraft, stripEphemeralBlobUrls } from './utils/documentDraft'
import { validateDocumentForExport } from './utils/validateExport'

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

  const { docRef, exportPdf, isExporting, pdfMode } = useExportPdf()
  const saveStatus = useAutoSave(doc)
  const catalog = loadCatalog()

  // Preview mode = pdfMode แต่ไม่ export
  const displayPdfMode = pdfMode || isPreview

  return (
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

        <main className="flex-1 overflow-y-auto p-6">
          {/* Preview mode banner */}
          {isPreview && (
            <div className="mx-auto mb-3 flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700" style={{ maxWidth: '794px' }}>
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
        </main>

        <RightPanel doc={doc} dispatch={dispatch} />
      </div>
    </PdfModeContext.Provider>
  )
}
