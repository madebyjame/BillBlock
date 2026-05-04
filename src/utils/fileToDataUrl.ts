/** อ่านไฟล์รูปเป็น data URL เพื่อเก็บใน state/localStorage และให้ html2canvas ไม่ taint */
export function readImageFileAsDataUrl(file: File, maxBytes = 3 * 1024 * 1024): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('กรุณาเลือกไฟล์รูปภาพ'))
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024)
    return Promise.reject(new Error(`ไฟล์ใหญ่เกินไป (สูงสุดประมาณ ${mb} MB)`))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}
