/**
 * BarcodeScanner — scan product barcode/QR via browser camera
 * Uses @zxing/browser (ZXing library), no native SDK required.
 *
 * Usage:
 *   <BarcodeScanner onDetect={(code) => handleBarcode(code)} onClose={() => setOpen(false)} />
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { X, ScanLine, CameraOff } from 'lucide-react'

interface Props {
  onDetect: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCode, setLastCode] = useState<string | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let mounted = true

    async function start() {
      try {
        if (!videoRef.current) return
        const controls = await reader.decodeFromVideoDevice(
          undefined,          // use default camera
          videoRef.current,
          (result, err) => {
            if (!mounted) return
            if (result) {
              const code = result.getText()
              setLastCode(code)
              onDetect(code)
            }
            // ignore DecodeHintType errors (no barcode in frame)
            if (err && err.name !== 'NotFoundException') {
              console.warn('[BarcodeScanner]', err)
            }
          },
        )
        controlsRef.current = controls
      } catch (e: unknown) {
        if (!mounted) return
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('Permission')) {
          setError('ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาต Camera ในเบราว์เซอร์')
        } else {
          setError('ไม่สามารถเปิดกล้องได้: ' + msg)
        }
      }
    }

    void start()

    return () => {
      mounted = false
      controlsRef.current?.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape to close
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ScanLine size={17} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">สแกนบาร์โค้ด</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <CameraOff size={22} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="h-full w-full object-cover" />

              {/* Scanning overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {/* Corner guides */}
                <div className="relative h-48 w-48">
                  <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-blue-400 rounded-tl-lg" />
                  <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-blue-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute left-1 right-1 top-1/2 h-0.5 -translate-y-1/2 animate-scan bg-blue-400/70" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Result */}
        <div className="px-4 py-3">
          {lastCode ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2">
              <p className="text-[11px] text-green-400 mb-0.5">พบรหัส</p>
              <p className="font-mono text-sm font-semibold text-white">{lastCode}</p>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500">
              {error ? 'ไม่สามารถสแกนได้' : 'วางบาร์โค้ดไว้ในกรอบ…'}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
