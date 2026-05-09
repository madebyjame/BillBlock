import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DocTypeCode } from '../types/document'
import type { DocumentData } from '../types/document'
import type { DocumentRow } from '../lib/documentApi'

export interface DocListRow {
  id: string
  doc_type: string
  status: DocumentRow['status']
  total_amount: number
  created_at: string
  updated_at: string
  due_date: string | null
  doc_number: string
  customer_name: string
  salesperson: string
  project_name: string
  credit: string
}

export function useDocumentsByType(docType: DocTypeCode) {
  const [rows, setRows] = useState<DocListRow[]>([])
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
          .select('id, doc_type, status, total_amount, created_at, updated_at, due_date, content')
          .eq('doc_type', docType)
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (err) throw err
        const parsed: DocListRow[] = (data ?? []).map((r: Record<string, unknown>) => {
          const content = r.content as Partial<DocumentData> | null
          return {
            id: r.id as string,
            doc_type: r.doc_type as string,
            status: r.status as DocumentRow['status'],
            total_amount: r.total_amount as number,
            created_at: r.created_at as string,
            updated_at: r.updated_at as string,
            due_date: typeof r.due_date === 'string' ? r.due_date : null,
            doc_number: content?.docMeta?.number ?? '-',
            customer_name: content?.customer?.name ?? '-',
            salesperson: content?.docMeta?.salesperson ?? '',
            project_name: content?.docMeta?.projectName ?? '',
            credit: content?.docMeta?.credit ?? '',
          }
        })
        setRows(parsed)
      } catch {
        if (cancelled) return
        setError('โหลดรายการเอกสารไม่สำเร็จ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [docType, tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { rows, loading, error, refetch }
}
