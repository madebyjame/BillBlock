import { supabase } from './supabase'
import { defaultDocument, DOC_TYPE_CODES, thaiToDocTypeCode } from '../types/document'
import type { DocumentData, DocTypeCode } from '../types/document'
import { calcDocSummary } from '../utils/calculations'
import { getProfile } from './profileApi'
import type { Profile } from './profileApi'

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

function getProfilePrefix(profile: Profile, docType: DocTypeCode): string {
  switch (docType) {
    case 'quotation':    return profile.quotation_prefix    || DOC_NUMBER_PREFIX.quotation
    case 'invoice':      return profile.invoice_prefix      || DOC_NUMBER_PREFIX.invoice
    case 'receipt':      return profile.receipt_prefix      || DOC_NUMBER_PREFIX.receipt
    case 'billing-note': return profile.billing_note_prefix || DOC_NUMBER_PREFIX['billing-note']
    case 'tax-invoice':  return profile.tax_invoice_prefix  || DOC_NUMBER_PREFIX['tax-invoice']
  }
}

// ─── Create (with Smart Defaults from profile) ────────────────────────────────
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

  // ── Smart Defaults: pull everything from profile ──────────────────────────
  try {
    const profile = await getProfile(userId)
    if (profile) {
      const effectivePrefix = getProfilePrefix(profile, docType)
      const effectiveDocNumber = `${effectivePrefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

      let vatMode: 'exclusive' | 'inclusive' = 'exclusive'
      let showVat = false
      if (profile.vat_type === 'included') { vatMode = 'inclusive'; showVat = true }
      if (profile.vat_type === 'excluded') { vatMode = 'exclusive'; showVat = true }

      const creditStr = profile.credit_days > 0 ? `${profile.credit_days} วัน` : ''

      content = {
        ...content,
        docMeta: {
          ...content.docMeta,
          number: effectiveDocNumber,
          credit: creditStr || content.docMeta.credit,
        },
        company: {
          ...content.company,
          name: profile.company_name || content.company.name,
          address: profile.address || content.company.address,
          phone: profile.phone || content.company.phone,
          email: profile.email || content.company.email,
          taxId: profile.tax_id || content.company.taxId,
          logoUrl: profile.logo_url || content.company.logoUrl,
        },
        footer: {
          ...content.footer,
          bankName: profile.bank_name || content.footer.bankName,
          accountName: profile.bank_account_name || content.footer.accountName,
          accountNumber: profile.bank_account_number || content.footer.accountNumber,
          bankNote: profile.bank_note || '',
          promptpayId: profile.promptpay_id || '',
          signatureUrl: profile.signature_url || content.footer.signatureUrl,
        },
        settings: {
          ...content.settings,
          themeColor: profile.theme_color || content.settings.themeColor,
          vatMode,
        },
        visibility: {
          ...content.visibility,
          summary: {
            ...content.visibility.summary,
            vat: showVat,
          },
          docMeta: {
            ...content.visibility.docMeta,
            credit: creditStr.length > 0,
          },
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

// ─── Duplicate ────────────────────────────────────────────────────────────────
export async function duplicateDocument(id: string, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('documents')
    .select('doc_type, content, total_amount')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  const docType = data.doc_type as DocTypeCode
  const original = data.content as DocumentData

  const year = new Date().getFullYear()
  const prefix = DOC_NUMBER_PREFIX[docType] ?? 'DOC'
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('doc_type', docType)

  const newNumber = `${prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

  const newContent: DocumentData = {
    ...(original as DocumentData),
    docMeta: {
      ...(original as DocumentData).docMeta,
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
    },
  }

  const { total } = calcDocSummary(newContent)

  const { data: newDoc, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      doc_type: docType,
      status: 'draft',
      total_amount: Math.round(total * 100) / 100,
      content: newContent,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)
  return (newDoc as { id: string }).id
}

// ─── Convert Document (shared logic) ─────────────────────────────────────────
async function convertDocument(
  id: string,
  userId: string,
  targetType: DocTypeCode,
): Promise<string> {
  const [{ data, error }, profile, { count }] = await Promise.all([
    supabase.from('documents').select('content').eq('id', id).single(),
    getProfile(userId).catch(() => null),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('doc_type', targetType),
  ])

  if (error) throw new Error(error.message)

  const original = data.content as DocumentData
  const year = new Date().getFullYear()
  const prefix = profile ? getProfilePrefix(profile, targetType) : DOC_NUMBER_PREFIX[targetType]
  const newNumber = `${prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

  const newContent: DocumentData = {
    ...original,
    docMeta: {
      ...original.docMeta,
      documentType: DOC_TYPE_CODES[targetType],
      number: newNumber,
      date: new Date().toISOString().split('T')[0],
    },
  }

  const { total } = calcDocSummary(newContent)

  const { data: newDoc, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      doc_type: targetType,
      status: 'draft',
      total_amount: Math.round(total * 100) / 100,
      content: newContent,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)
  return (newDoc as { id: string }).id
}

export async function convertToInvoice(id: string, userId: string): Promise<string> {
  return convertDocument(id, userId, 'invoice')
}

export async function convertToReceipt(id: string, userId: string): Promise<string> {
  return convertDocument(id, userId, 'receipt')
}

export async function convertToTaxInvoice(id: string, userId: string): Promise<string> {
  return convertDocument(id, userId, 'tax-invoice')
}
