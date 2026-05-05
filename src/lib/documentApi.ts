import { supabase } from './supabase'
import { defaultDocument } from '../types/document'
import type { DocumentData } from '../types/document'
import { calcDocSummary } from '../utils/calculations'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DocumentRow {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createDocument(userId: string): Promise<string> {
  const content: DocumentData = {
    ...defaultDocument,
    docMeta: {
      ...defaultDocument.docMeta,
      date: new Date().toISOString().split('T')[0],
    },
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      doc_type: content.docMeta.documentType,
      status: 'draft',
      total_amount: 0,
      content,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

// ─── Update (auto-save + explicit save with optional status) ──────────────────
export async function updateDocument(
  id: string,
  doc: DocumentData,
  status?: DocumentRow['status'],
): Promise<void> {
  const { total } = calcDocSummary(doc)

  const patch: Record<string, unknown> = {
    doc_type: doc.docMeta.documentType,
    total_amount: Math.round(total * 100) / 100,
    content: doc,
    updated_at: new Date().toISOString(),
  }
  if (status) patch.status = status

  const { error } = await supabase.from('documents').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
