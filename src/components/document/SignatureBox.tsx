import { formatDate } from '../../utils/calculations'
import { readImageFileAsDataUrl } from '../../utils/fileToDataUrl'
import { useEditorCallbacks } from '../../context/EditorCallbacksContext'
import { F } from './InvoiceInputs'

export function SignatureBox({ pdfMode, label, title, onLabelChange, onTitleChange,
  signatureUrl, signatureScale = 1, onScaleChange,
  stampUrl, signatureDate, showStamp,
  onSignatureUpload, onStampUpload, onDateChange }: {
  pdfMode: boolean; label: string; title: string
  onLabelChange: (v: string) => void; onTitleChange?: (v: string) => void
  signatureUrl?: string; signatureScale?: number; onScaleChange?: (s: number) => void
  stampUrl?: string; signatureDate?: string; showStamp?: boolean
  onSignatureUpload?: (url: string) => void; onStampUpload?: (url: string) => void
  onDateChange?: (d: string) => void
}) {
  const sigH = Math.round(64 * signatureScale)
  const { onSignatureSave, savedSignatures } = useEditorCallbacks()

  return (
    <div className="h-full flex flex-col items-center text-sm">
      {/* Label */}
      {pdfMode
        ? <p className="text-slate-800 font-medium mb-3 text-center">{label}</p>
        : <F pdfMode={pdfMode} value={label} className="text-slate-600 mb-3 text-center" onChange={onLabelChange} />}

      {/* Signature + date */}
      <div className="flex-1 w-full flex flex-col items-center justify-end pb-2 relative">
        {onSignatureUpload && (
          <div className="flex flex-col items-center gap-1 w-full">
            <label className={`flex items-center justify-center ${pdfMode ? '' : 'cursor-pointer'}`}>
              {signatureUrl
                ? <img src={signatureUrl} alt="sig"
                    style={{ height: `${sigH}px` }}
                    className="object-contain max-w-full" />
                : !pdfMode && <span className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors">+ อัปโหลดลายเซ็น</span>
              }
              {!pdfMode && <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]; e.target.value = ''
                  if (!f || !onSignatureUpload) return
                  onSignatureSave(f)
                  void readImageFileAsDataUrl(f).then(onSignatureUpload, err => alert(err instanceof Error ? err.message : String(err)))
                }} />}
            </label>

            {/* Saved signature picker (only when there are saved signatures) */}
            {!pdfMode && savedSignatures.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-center mt-1">
                {savedSignatures.map(sig => (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => onSignatureUpload(sig.url)}
                    title={sig.name}
                    className={`h-8 w-12 rounded border bg-white overflow-hidden transition-all hover:border-blue-400 ${
                      signatureUrl === sig.url ? 'border-blue-500 ring-1 ring-blue-300' : 'border-slate-200'
                    }`}
                  >
                    <img src={sig.url} alt={sig.name} className="h-full w-full object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}

            {!pdfMode && signatureUrl && onScaleChange && (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => onScaleChange(Math.max(0.25, signatureScale - 0.25))}
                  className="h-4 w-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs leading-none flex items-center justify-center">−</button>
                <span className="text-[9px] text-slate-400 w-7 text-center">{Math.round(signatureScale * 100)}%</span>
                <button type="button" onClick={() => onScaleChange(Math.min(3, signatureScale + 0.25))}
                  className="h-4 w-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs leading-none flex items-center justify-center">+</button>
              </div>
            )}
          </div>
        )}

        {showStamp && onStampUpload && (
          <label className={`absolute right-0 bottom-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-200 overflow-hidden ${pdfMode ? '' : 'cursor-pointer hover:border-blue-300'}`}>
            {stampUrl
              ? <img src={stampUrl} alt="stamp" className="h-full w-full object-contain" />
              : !pdfMode && <span className="text-[9px] text-slate-300 text-center">ตรา</span>
            }
            {!pdfMode && <input type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                void readImageFileAsDataUrl(f).then(onStampUpload, err => alert(err instanceof Error ? err.message : String(err)))
              }} />}
          </label>
        )}
      </div>

      {onDateChange && (
        pdfMode
          ? <p className="text-xs text-slate-700 mb-1">{signatureDate ? formatDate(signatureDate) : ''}</p>
          : <input type="date" value={signatureDate ?? ''} onChange={e => onDateChange(e.target.value)}
              className="text-xs text-slate-400 border-0 bg-transparent mb-1 focus:outline-none" />
      )}

      <div className={`w-full pt-1 text-center ${pdfMode ? 'border-t border-slate-600' : 'border-t border-slate-400'}`}>
        {pdfMode
          ? <span className="text-xs text-slate-800 font-medium">{title}</span>
          : onTitleChange
            ? <F pdfMode={pdfMode} value={title} className="text-xs text-slate-500 text-center" onChange={onTitleChange} />
            : <span className="text-xs text-slate-500">{title}</span>
        }
      </div>
    </div>
  )
}
