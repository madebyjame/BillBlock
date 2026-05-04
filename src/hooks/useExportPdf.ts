import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

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

    // รอ font และ image โหลดเสร็จ
    await document.fonts.ready
    await new Promise(r => setTimeout(r, 80))

    try {
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        // ใช้ scrollWidth/scrollHeight เพื่อ capture เนื้อหาเต็ม ไม่ตัดตาม viewport
        width: el.scrollWidth,
        height: el.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()    // 210mm
      const pageH = pdf.internal.pageSize.getHeight()   // 297mm
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width

      // แบ่งหน้าถ้าเนื้อหายาวเกิน A4
      let posY = 0
      while (posY < imgH) {
        if (posY > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -posY, imgW, imgH)
        posY += pageH
      }

      pdf.save(filename)
    } catch (err) {
      console.error('[BillBlock] PDF export error:', err)
      alert(`Export ไม่สำเร็จ: ${err instanceof Error ? err.message : 'Unknown error'}\n\nกรุณา screenshot console และแจ้งให้ทราบ`)
    } finally {
      flushSync(() => {
        setPdfMode(false)
        setIsExporting(false)
      })
    }
  }

  return { docRef, exportPdf, isExporting, pdfMode }
}
