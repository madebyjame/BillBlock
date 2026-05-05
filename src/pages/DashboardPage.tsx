import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">ยินดีต้อนรับ, {user?.email}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/editor/new')}
          className="flex items-center gap-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-left hover:border-blue-400 hover:bg-blue-100 transition-colors"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-700">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">สร้างเอกสารใหม่</p>
            <p className="text-xs text-slate-500 mt-0.5">ใบเสนอราคา, ใบแจ้งหนี้ และอื่นๆ</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">เอกสารทั้งหมด</p>
            <p className="text-xs text-slate-500 mt-0.5">ดูและจัดการเอกสารที่บันทึกไว้</p>
          </div>
        </button>
      </div>

      {/* Placeholder stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-600 mb-4">ภาพรวม</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[['เอกสารทั้งหมด', '—'], ['เดือนนี้', '—'], ['ยอดรวม', '—']].map(([label, val]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-800">{val}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-300 text-center mt-4">ข้อมูลจริงจะแสดงเมื่อเชื่อมต่อกับ Supabase</p>
      </div>
    </div>
  )
}
