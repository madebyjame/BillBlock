import { useEffect, useState } from 'react'
import { AlarmClock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface Doc { id: string; content: unknown; due_date: string | null }

function daysLeft(due: string) {
  const d = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000)
  return d
}

export default function ExpiringQuotesWidget() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const in7   = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('documents')
        .select('id, content, due_date')
        .eq('user_id', user!.id)
        .eq('doc_type', 'quotation')
        .eq('status', 'sent')
        .gte('due_date', today)
        .lte('due_date', in7)
        .order('due_date', { ascending: true })
        .limit(5)
      setDocs((data ?? []) as Doc[])
      setLoading(false)
    }
  }, [user])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <AlarmClock size={14} className="text-orange-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ใบเสนอราคาใกล้หมดอายุ</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-slate-400">ไม่มีใบเสนอราคาหมดอายุใน 7 วัน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {docs.map(doc => {
            const content = doc.content as Record<string, unknown> | null
            const num  = (content?.docMeta as Record<string,unknown> | null)?.number as string | undefined
            const cust = (content?.customer as Record<string,unknown> | null)?.name as string | undefined
            const days = doc.due_date ? daysLeft(doc.due_date) : null
            return (
              <button key={doc.id} onClick={() => navigate(`/editor/${doc.id}`)}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-left hover:bg-orange-100 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{num ?? 'ร่าง'}</p>
                  <p className="truncate text-[10px] text-slate-400">{cust ?? '—'}</p>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  days !== null && days <= 2 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {days !== null ? `${days} วัน` : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
