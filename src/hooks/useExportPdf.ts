import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Hook สำหรับ Export Canvas เป็น PDF
 * ใช้ html2canvas จับ screenshot แล้วใส่ใน jsPDF
 */
export function useExportPdf() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function exportPdf(filename = 'document.pdf') {
    if (!canvasRef.current) return
    setIsExporting(true)

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,        // ความละเอียดสูงขึ้น 2x
        useCORS: true,   // รองรับรูปภาพจาก URL อื่น
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // ถ้าเนื้อหายาวเกิน 1 หน้า ให้แบ่งหน้าอัตโนมัติ
      let y = 0
      while (y < imgHeight) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight)
        y += pageHeight
      }

      pdf.save(filename)
    } finally {
      setIsExporting(false)
    }
  }

  return { canvasRef, exportPdf, isExporting }
}
