export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">ตั้งค่าบริษัท</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        {[
          { label: 'ชื่อบริษัท', placeholder: 'บริษัท ตัวอย่าง จำกัด' },
          { label: 'ที่อยู่', placeholder: '123 ถนน...' },
          { label: 'เลขประจำตัวผู้เสียภาษี', placeholder: '0000000000000' },
          { label: 'เบอร์โทร', placeholder: '02-xxx-xxxx' },
          { label: 'อีเมล', placeholder: 'info@company.com' },
        ].map(({ label, placeholder }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
              disabled
              placeholder={`${placeholder} (เร็วๆ นี้)`}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
        ))}

        <div className="pt-2">
          <button disabled className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed">
            บันทึกการตั้งค่า (เร็วๆ นี้)
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-300 text-center mt-4">
        Placeholder — จะ sync กับตาราง profiles ใน Supabase ใน Phase ถัดไป
      </p>
    </div>
  )
}
