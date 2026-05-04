import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function useExportPdf() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function exportPdf(filename = 'document.pdf') {
    const el = canvasRef.current
    if (!el) return
    setIsExporting(true)

    // ซ่อน toolbar และ toggle panel ที่ใช้ในแอปแต่ไม่ควรปรากฏใน PDF
    const hiddenEls = el.querySelectorAll<HTMLElement>(
      '[data-pdf-hide], .group-hover\\:opacity-100, .border-l'
    )
    const prevStyles: string[] = []
    hiddenEls.forEach(e => {
      prevStyles.push(e.style.cssText)
      e.style.visibility = 'hidden'
    })

    // ซ่อนปุ่มทั้งหมดใน toolbar
    const toolbars = el.querySelectorAll<HTMLElement>('.group .opacity-0')
    const toolbarStyles: string[] = []
    toolbars.forEach(e => {
      toolbarStyles.push(e.style.cssText)
      e.style.display = 'none'
    })

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()   // 210mm
      const pageH = pdf.internal.pageSize.getHeight()  // 297mm
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width

      // แบ่งหน้าอัตโนมัติ
      let posY = 0
      while (posY < imgH) {
        if (posY > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -posY, imgW, imgH)
        posY += pageH
      }

      pdf.save(filename)
    } finally {
      // คืนค่า visibility
      hiddenEls.forEach((e, i) => { e.style.cssText = prevStyles[i] })
      toolbars.forEach((e, i) => { e.style.cssText = toolbarStyles[i] })
      setIsExporting(false)
    }
  }

  return { canvasRef, exportPdf, isExporting }
}
