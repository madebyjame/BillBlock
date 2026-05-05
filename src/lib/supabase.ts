import { createClient } from '@supabase/supabase-js'

// ดึงค่าจาก Environment Variables
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// แก้ไขให้ไม่พ่น Error ขวางแอป แต่ให้แจ้งเตือนผ่าน Console แทน
if (!url || !key) {
  console.warn("แจ้งเตือน: ไม่พบ Supabase URL หรือ Key ใน Environment Variables")
}

// สร้าง Client โดยใส่ค่าว่างเป็น fallback เพื่อไม่ให้แอป Crash
export const supabase = createClient(url || '', key || '')