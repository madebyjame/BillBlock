import { useRef, useState } from 'react'

export function useExportPdf() {
  const docRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [pdfMode, setPdfMode] = useState(false)

  async function exportPdf(filename = 'document.pdf') {
    const el = docRef.current
    if (!el) return
    setIsExporting(true)

    // 1. เข้า pdfMode — ซ่อน UI chrome ทั้งหมด (React re-render)
    setPdfMode(true)

    // 2. รอให้ React render เสร็จก่อน
    await new Promise(r => setTimeout(r, 150))

    try {
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: el.offsetWidth,
        windowHeight: el.offsetHeight,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()   // 210mm
      const pageH = pdf.internal.pageSize.getHeight()  // 297mm
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
    } finally {
      setPdfMode(false)
      setIsExporting(false)
    }
  }

  return { docRef, exportPdf, isExporting, pdfMode }
}
