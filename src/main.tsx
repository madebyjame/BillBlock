import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { Toaster } from 'sonner'
import { supabaseConfigured } from './lib/supabase.ts'
import PwaInstallBanner from './components/PwaInstallBanner.tsx'

function MissingConfigScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
          <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-800 mb-2">ตั้งค่า Environment Variables</h1>
        <p className="text-sm text-slate-500 mb-6">
          ไม่พบค่า <code className="bg-slate-100 px-1 rounded text-red-600">VITE_SUPABASE_URL</code> และ{' '}
          <code className="bg-slate-100 px-1 rounded text-red-600">VITE_SUPABASE_ANON_KEY</code>
        </p>
        <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-3 text-slate-600 mb-6">
          <p className="font-semibold text-slate-700">วิธีแก้ไขบน Vercel:</p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>เปิด Vercel Dashboard → เลือก Project นี้</li>
            <li>ไปที่ <span className="font-medium">Settings → Environment Variables</span></li>
            <li>เพิ่มตัวแปรทั้งสอง แล้วกด Save</li>
            <li>Redeploy โปรเจกต์อีกครั้ง</li>
          </ol>
        </div>
        <p className="text-xs text-slate-400">
          พัฒนา local? สร้างไฟล์ <code className="bg-slate-100 px-1 rounded">.env.local</code> ที่ root ของโปรเจกต์
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {supabaseConfigured ? (
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
        <PwaInstallBanner />
      </AuthProvider>
    ) : (
      <MissingConfigScreen />
    )}
  </StrictMode>,
)
