import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

function waitNextFrames(n = 2): Promise<void> {
  let remaining = n
  return new Promise(resolve => {
    function tick() {
      remaining -= 1
      if (remaining <= 0) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

// Wait for every <img> inside the container to fully decode before capture.
// Signature and stamp images are the main culprits for "missing" sections.
async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
  await Promise.all(
    imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>(res => {
        img.onload = () => res()
        img.onerror = () => res()          // broken image — don't block export
        setTimeout(res, 5_000)             // safety timeout
      })
    }),
  )
}

// Compute page-start offsets (in mm) avoiding cuts inside no-break zones.
// If a normal page cut would fall inside a zone, we pull the cut back to the
// zone's start so the whole block opens on the next page.
function computePageStarts(
  totalMM: number,
  pageMM: number,
  noBreakZones: Array<{ start: number; end: number }>,
): number[] {
  const starts: number[] = []
  let pos = 0
  while (pos + 0.5 < totalMM) {
    starts.push(pos)
    const natural = pos + pageMM
    if (natural >= totalMM) break          // last partial page — already added

    let cut = natural
    for (const zone of noBreakZones) {
      if (cut > zone.start && cut < zone.end) {
        cut = zone.start                   // push zone to next page
        break
      }
    }
    // Safety: never go backwards (e.g. zone larger than a full page)
    pos = cut > pos ? cut : natural
  }
  return starts
}

export function useExportPdf() {
  const docRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [pdfMode, setPdfMode] = useState(false)

  async function exportPdf(filename = 'document.pdf') {
    const el = docRef.current
    if (!el) {
      alert('ไม่พบเอกสาร กรุณาลองใหม่')
      return
    }

    setIsExporting(true)

    // flushSync forces React to flush the PDF-mode DOM update synchronously
    // so html2canvas sees static text, not live input elements.
    flushSync(() => setPdfMode(true))

    try {
      // 1. Wait for fonts
      await document.fonts.ready

      // 2. Wait for ALL images (signature, stamp, logo) to finish loading
      await waitForImages(el)

      // 3. Give browser time to repaint after image loads + PDF-mode layout
      await waitNextFrames(3)
      await new Promise(r => setTimeout(r, 150))

      // 4. Measure no-break zones now (PDF-mode layout is settled).
      //    Positions are stored as fractions of total content height so they
      //    can be converted to mm once we know imgH from the canvas.
      const containerRect = el.getBoundingClientRect()
      const totalPx = el.scrollHeight
      const noBreakFractions = Array.from(
        el.querySelectorAll<HTMLElement>('[data-pdf-no-break]'),
      ).map(node => {
        const rect = node.getBoundingClientRect()
        return {
          start: (rect.top - containerRect.top) / totalPx,
          end: (rect.bottom - containerRect.top) / totalPx,
        }
      })

      // html2canvas (standard) doesn't support oklch colours from Tailwind v4 —
      // html2canvas-pro is a maintained fork that does.
      const html2canvas = (await import('html2canvas-pro')).default
      const { default: jsPDF } = await import('jspdf')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: el.scrollWidth,
        height: el.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      })

      if (!canvas.width || !canvas.height) {
        throw new Error('ภาพเอกสารว่างเปล่า — ลองรีเฟรชหน้าแล้ว export ใหม่')
      }

      let imgData: string
      let imgFmt: 'PNG' | 'JPEG' = 'PNG'
      try {
        imgData = canvas.toDataURL('image/png')
      } catch {
        imgData = canvas.toDataURL('image/jpeg', 0.92)
        imgFmt = 'JPEG'
      }

      if (!imgData.startsWith('data:image')) {
        throw new Error('สร้างภาพจากเอกสารไม่สำเร็จ — ตรวจสอบว่าใช้รูปที่อัปโหลดจากเครื่องเท่านั้น')
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()   // 210 mm
      const pageH = pdf.internal.pageSize.getHeight()  // 297 mm
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width

      // Convert fractional positions → mm now that imgH is known
      const noBreakZones = noBreakFractions.map(f => ({
        start: f.start * imgH,
        end: f.end * imgH,
      }))

      // Smart page breaks — no zone gets sliced across pages
      const pageStarts = computePageStarts(imgH, pageH, noBreakZones)

      pageStarts.forEach((startY, i) => {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, imgFmt, 0, -startY, imgW, imgH)
      })

      pdf.save(filename)
    } catch (err) {
      console.error('[BillBlock] PDF export error:', err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      alert(
        `Export PDF ไม่สำเร็จ:\n${msg}\n\n` +
          'ถ้ามีรูปจากลิงก์ภายนอก ให้ลองบันทึกเป็นไฟล์แล้วอัปโหลดใหม่ หรือลองปิดโหมดดูตัวอย่างแล้วกด Export อีกครั้ง',
      )
    } finally {
      flushSync(() => {
        setPdfMode(false)
        setIsExporting(false)
      })
    }
  }

  return { docRef, exportPdf, isExporting, pdfMode }
}
