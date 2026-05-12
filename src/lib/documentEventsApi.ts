import { supabase } from './supabase'

export interface DocumentEvent {
  id: string
  document_id: string
  event_type: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export async function logDocumentEvent(
  documentId: string,
  eventType: string,
  oldValue?: string,
  newValue?: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('document_events').insert({
    document_id: documentId,
    user_id: user.id,
    event_type: eventType,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  })
}

export async function getDocumentEvents(documentId: string): Promise<DocumentEvent[]> {
  const { data, error } = await supabase
    .from('document_events')
    .select('id, document_id, event_type, old_value, new_value, created_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as DocumentEvent[]
}
