import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function fmtThb(n: number) {
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface TopDoc { id: string; total_amount: number; content: unknown }

export default function TopInvoiceWidget() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<TopDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void load()
    async function load() {
      setLoading(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data } = await supabase
        .from('documents')
        .select('id, total_amount, content')
        .eq('user_id', user!.id)
        .in('doc_type', ['invoice'])
        .in('status', ['sent', 'paid'])
        .gte('created_at', monthStart)
        .order('total_amount', { ascending: false })
        .limit(1)
        .maybeSingle()
      setDoc(data as TopDoc | null)
      setLoading(false)
    }
  }, [user])

  const content  = doc?.content as Record<string, unknown> | null
  const customer = (content?.customer as Record<string, unknown> | null)?.name as string | undefined
  const docNum   = (content?.docMeta as Record<string, unknown> | null)?.number as string | undefined

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-amber-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ใบแจ้งหนี้สูงสุดเดือนนี้</p>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : !doc ? (
        <p className="text-xs text-slate-400 mt-2">ยังไม่มีใบแจ้งหนี้เดือนนี้</p>
      ) : (
        <button
          onClick={() => navigate(`/editor/${doc.id}`)}
          className="mt-2 flex flex-col gap-0.5 text-left hover:opacity-80 transition-opacity"
        >
          <p className="text-2xl font-bold text-slate-800">{fmtThb(doc.total_amount)}</p>
          {docNum && <p className="text-xs font-medium text-blue-600">{docNum}</p>}
          {customer && <p className="truncate text-xs text-slate-400">{customer}</p>}
        </button>
      )}
    </div>
  )
}
