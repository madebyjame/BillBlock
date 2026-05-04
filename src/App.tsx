import { useReducer } from 'react'
import { PdfModeContext } from './components/InvoiceDocument'
import InvoiceDocument from './components/InvoiceDocument'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import { documentReducer, defaultDocument } from './store/documentStore'
import { useExportPdf } from './hooks/useExportPdf'

export default function App() {
  const [doc, dispatch] = useReducer(documentReducer, defaultDocument)
  const { docRef, exportPdf, isExporting, pdfMode } = useExportPdf()

  return (
    <PdfModeContext.Provider value={pdfMode}>
      <div className="flex h-screen overflow-hidden bg-slate-100">
        {/* ── ซ้าย: Branding + Export ── */}
        <LeftPanel
          onExportPdf={() => exportPdf('bill-block-document.pdf')}
          isExporting={isExporting}
        />

        {/* ── กลาง: Invoice Document ── */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="shadow-lg rounded-sm">
            <InvoiceDocument doc={doc} dispatch={dispatch} docRef={docRef} />
          </div>
        </main>

        {/* ── ขวา: Controls ── */}
        <RightPanel doc={doc} dispatch={dispatch} />
      </div>
    </PdfModeContext.Provider>
  )
}
