import { supabase } from './supabase'

export interface Profile {
  id: string
  // Tab 1: Company
  company_name: string
  address: string
  tax_id: string
  phone: string
  email: string
  website: string
  // Tab 2: Document Design
  logo_url: string
  signature_url: string
  theme_color: string
  invoice_prefix: string
  quotation_prefix: string
  // Tab 3: Payment Methods
  bank_name: string
  bank_branch: string
  bank_account_name: string
  bank_account_number: string
  bank_note: string
  // Tab 4: Defaults
  vat_type: string      // 'none' | 'included' | 'excluded'
  credit_days: number
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Profile | null
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
}

/**
 * Upload a logo or digital-signature image to Supabase Storage.
 *
 * Prerequisites (one-time setup):
 *   Supabase Dashboard → Storage → New bucket
 *   Name: "company-assets", toggle Public = ON
 *
 * @returns Public URL of the uploaded file
 */
export async function uploadCompanyFile(
  userId: string,
  type: 'logo' | 'signature',
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/${type}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('company-assets').getPublicUrl(path)
  return data.publicUrl
}
