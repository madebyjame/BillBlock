/**
 * QuickSetupBar — compact banner shown at the top of Dashboard
 * when a new user hasn't set up their company profile yet.
 *
 * Three actions:
 *   "ใส่เลย"           → opens QuickSetupModal (3 fields)
 *   "ใช้ตัวอย่างแทน"  → seeds demo customer + product then dismisses
 *   ✕                  → dismisses permanently (localStorage)
 */
import { useEffect, useState } from 'react'
import { Loader2, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { seedDemoData } from '../lib/seedDemoData'
import QuickSetupModal from './QuickSetupModal'

function dismissKey(uid: string) {
  return `bb_setup_bar_dismissed_${uid}`
}

export default function QuickSetupBar() {
  const { user } = useAuth()
  const uid = user?.id ?? ''

  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Show only if: not dismissed + no company_name in profile
  useEffect(() => {
    if (!uid) return
    if (localStorage.getItem(dismissKey(uid)) === '1') return

    supabase
      .from('profiles')
      .select('company_name')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => {
        const hasCompany =
          typeof data?.company_name === 'string' && data.company_name.trim().length > 0
        if (!hasCompany) setVisible(true)
      })
  }, [uid])

  function dismiss() {
    localStorage.setItem(dismissKey(uid), '1')
    setVisible(false)
  }

  async function handleUseDemoData() {
    if (!uid || seeding) return
    setSeeding(true)
    try {
      await seedDemoData(uid)
      toast.success('สร้างข้อมูลตัวอย่างแล้ว', {
        description: 'มีลูกค้าและสินค้าตัวอย่างพร้อมให้ทดลองออกเอกสาร',
        duration: 5000,
      })
      dismiss()
    } catch {
      toast.error('สร้างข้อมูลตัวอย่างไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSeeding(false)
    }
  }

  if (!visible) return null

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/60 px-5 py-3.5 shadow-sm">
        {/* Icon + text */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Zap size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">เริ่มต้นใช้งาน BillBlock</p>
            <p className="text-xs text-slate-500">
              ใส่ข้อมูลบริษัท → เพิ่มลูกค้า → เพิ่มสินค้า แล้วออกเอกสารได้เลย
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            ใส่เลย
          </button>
          <button
            onClick={() => void handleUseDemoData()}
            disabled={seeding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {seeding
              ? <><Loader2 size={11} className="animate-spin" /> กำลังสร้าง...</>
              : 'ใช้ตัวอย่างแทน'
            }
          </button>
          <button
            onClick={dismiss}
            title="ปิด"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {modalOpen && (
        <QuickSetupModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); dismiss() }}
        />
      )}
    </>
  )
}
