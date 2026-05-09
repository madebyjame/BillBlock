import { supabase } from './supabase'
import { PLAN_LIMITS, PlanLimitError } from './planLimits'
import type { Plan } from './planLimits'

export interface SavedSignature {
  id: string
  user_id: string
  name: string
  url: string
  is_default: boolean
  created_at: string
}

export async function listSignatures(userId: string): Promise<SavedSignature[]> {
  const { data, error } = await supabase
    .from('signatures')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SavedSignature[]
}

export async function saveSignature(
  userId: string,
  name: string,
  file: File,
): Promise<SavedSignature> {
  // Check plan limit
  const { data: planData } = await supabase.rpc('get_user_plan', { uid: userId })
  const plan = (planData as Plan) ?? 'free'
  const limit = PLAN_LIMITS[plan].signatures

  if (isFinite(limit)) {
    const { count } = await supabase
      .from('signatures')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if ((count ?? 0) >= limit) throw new PlanLimitError('signatures', limit)
  }

  // Upload file to storage
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/signatures/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(path, file, { upsert: false })
  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path)
  const url = urlData.publicUrl

  // Determine if this should be default (first signature)
  const { count: existingCount } = await supabase
    .from('signatures')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  const isDefault = (existingCount ?? 0) === 0

  const { data, error } = await supabase
    .from('signatures')
    .insert({ user_id: userId, name, url, is_default: isDefault })
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  // Sync profiles.signature_url when this is the default
  if (isDefault) {
    await supabase.from('profiles').update({ signature_url: url }).eq('id', userId)
  }

  return data as SavedSignature
}

export async function deleteSignature(id: string, userId: string): Promise<void> {
  const { data: sig } = await supabase
    .from('signatures')
    .select('url, is_default')
    .eq('id', id)
    .single()

  if (!sig) return

  // Delete from DB first
  const { error } = await supabase.from('signatures').delete().eq('id', id)
  if (error) throw new Error(error.message)

  // Delete from storage (best-effort, don't fail if this errors)
  try {
    const storageKey = (sig.url as string).split('/company-assets/')[1]
    if (storageKey) {
      await supabase.storage.from('company-assets').remove([storageKey])
    }
  } catch { /* storage cleanup is non-critical */ }

  // If deleted was the default, promote the next one
  if (sig.is_default) {
    const { data: remaining } = await supabase
      .from('signatures')
      .select('id, url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (remaining) {
      await supabase.from('signatures').update({ is_default: true }).eq('id', remaining.id)
      await supabase.from('profiles').update({ signature_url: remaining.url }).eq('id', userId)
    } else {
      await supabase.from('profiles').update({ signature_url: '' }).eq('id', userId)
    }
  }
}

export async function setDefaultSignature(userId: string, signatureId: string): Promise<string> {
  await supabase.from('signatures').update({ is_default: false }).eq('user_id', userId)

  const { data: sig, error } = await supabase
    .from('signatures')
    .update({ is_default: true })
    .eq('id', signatureId)
    .select('url')
    .single()
  if (error) throw new Error(error.message)

  const url = (sig as { url: string }).url
  await supabase.from('profiles').update({ signature_url: url }).eq('id', userId)
  return url
}
