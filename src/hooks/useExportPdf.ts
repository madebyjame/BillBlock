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

    // flushSync บังคับให้ React update DOM แบบ synchronous ทันที
    // ก่อนที่ html2canvas จะ capture — ไม่งั้น input fields ยังอยู่
    flushSync(() => setPdfMode(true))

    try {
      await document.fonts.ready
      await waitNextFrames(2)
      await new Promise(r => setTimeout(r, 120))

      // html2canvas (ตัวเดิม) ไม่รองรับสีแบบ oklch ที่ Tailwind v4 ใช้ — ใช้ fork ที่รองรับแทน
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

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width

      let posY = 0
      while (posY < imgH) {
        if (posY > 0) pdf.addPage()
        pdf.addImage(imgData, imgFmt, 0, -posY, imgW, imgH)
        posY += pageH
      }

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
