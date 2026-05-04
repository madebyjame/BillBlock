/** สร้าง unique ID สำหรับ Block และ TableRow */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
