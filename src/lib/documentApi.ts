import { supabase } from './supabase'
import { defaultDocument, DOC_TYPE_CODES, thaiToDocTypeCode } from '../types/document'
import type { DocumentData, DocTypeCode } from '../types/document'
import { calcDocSummary } from '../utils/calculations'
import { getProfile } from './profileApi'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DocumentRow {
  id: string
  doc_type: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
}

const DOC_NUMBER_PREFIX: Record<DocTypeCode, string> = {
  quotation: 'QT',
  invoice: 'INV',
  receipt: 'REC',
  'billing-note': 'BN',
  'tax-invoice': 'TAX',
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createDocument(
  userId: string,
  docType: DocTypeCode = 'quotation',
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = DOC_NUMBER_PREFIX[docType]

  // Count existing docs of this type for sequential number
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('doc_type', docType)

  const docNumber = `${prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`
  const documentType = DOC_TYPE_CODES[docType]

  let content: DocumentData = {
    ...defaultDocument,
    docMeta: {
      ...defaultDocument.docMeta,
      documentType,
      number: docNumber,
      date: new Date().toISOString().split('T')[0],
    },
  }
  try {
    const profile = await getProfile(userId)
    if (profile) {
      content = {
        ...content,
        company: {
          ...content.company,
          name: profile.company_name || content.company.name,
          address: profile.address || content.company.address,
          phone: profile.phone || content.company.phone,
          email: profile.email || content.company.email,
          taxId: profile.tax_id || content.company.taxId,
        },
      }
    }
  } catch {
    // Profile auto-fill is optional; ignore and continue creating document.
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      doc_type: docType,
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
    doc_type: thaiToDocTypeCode(doc.docMeta.documentType),
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

export async function updateDocumentStatus(id: string, status: DocumentRow['status']): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
