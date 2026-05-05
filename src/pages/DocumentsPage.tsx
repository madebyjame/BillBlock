import { useNavigate } from 'react-router-dom'

export default function DocumentsPage() {
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">เอกสารทั้งหมด</h1>
        <button
          onClick={() => navigate('/editor/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างใหม่
        </button>
      </div>

      {/* Placeholder table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500">เลขที่</th>
              <th className="px-4 py-3 font-semibold text-slate-500">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-slate-500">ลูกค้า</th>
              <th className="px-4 py-3 font-semibold text-slate-500">วันที่</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-right">ยอดรวม</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                <svg className="h-10 w-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium text-slate-500">ยังไม่มีเอกสาร</p>
                <p className="text-xs mt-1">กดปุ่ม "สร้างใหม่" เพื่อเริ่มต้น</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-300 text-center mt-4">
        Placeholder — รายการจริงจะ fetch จาก Supabase ใน Phase ถัดไป
      </p>
    </div>
  )
}
