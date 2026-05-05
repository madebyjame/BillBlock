import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { DocumentRow } from '../lib/documentApi'

interface DocStats {
  total: number
  thisMonth: number
  totalAmount: number
  thisMonthAmount: number
  byStatus: Record<DocumentRow['status'], number>
}

interface UseDocumentsResult {
  rows: DocumentRow[]
  recentRows: DocumentRow[]
  loading: boolean
  error: string
  stats: DocStats
  refetch: () => void
}

const emptyStats: DocStats = { total: 0, thisMonth: 0, totalAmount: 0, thisMonthAmount: 0, byStatus: { draft: 0, sent: 0, paid: 0, cancelled: 0 } }

export function useDocuments(): UseDocumentsResult {
  const [rows, setRows] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data, error: err } = await supabase
          .from('documents')
          .select('id, doc_type, status, total_amount, created_at, updated_at')
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (err) throw err
        setRows((data ?? []) as DocumentRow[])
      } catch {
        if (cancelled) return
        setError('โหลดรายการเอกสารไม่สำเร็จ')
        toast.error('ไม่สามารถโหลดข้อมูลเอกสารได้ กรุณาลองใหม่อีกครั้ง')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()

    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const stats: DocStats = rows.reduce<DocStats>((acc, r) => {
    acc.total++
    acc.totalAmount += r.total_amount
    if (r.created_at >= monthStart) {
      acc.thisMonth++
      acc.thisMonthAmount += r.total_amount
    }
    acc.byStatus[r.status] = (acc.byStatus[r.status] ?? 0) + 1
    return acc
  }, { total: 0, thisMonth: 0, totalAmount: 0, thisMonthAmount: 0, byStatus: { draft: 0, sent: 0, paid: 0, cancelled: 0 } })

  return { rows, recentRows: rows.slice(0, 5), loading, error, stats: loading ? emptyStats : stats, refetch }
}
