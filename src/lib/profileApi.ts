import { supabase } from './supabase'

export interface Profile {
  id: string
  company_name: string
  address: string
  tax_id: string
  phone: string
  email: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, company_name, address, tax_id, phone, email')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Profile | null
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })

  if (error) throw new Error(error.message)
}
