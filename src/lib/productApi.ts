import { supabase } from './supabase'

export interface ProductRow {
  id: string
  user_id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  created_at?: string
  updated_at?: string
}

export interface ProductInput {
  name: string
  price: number
  unit: string
  stock: number
  category: string
}

export async function listProducts(): Promise<ProductRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('products')
    .select('id, user_id, name, price, unit, stock, category, created_at, updated_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProductRow[]
}

export async function createProduct(userId: string, input: ProductInput): Promise<void> {
  const { error } = await supabase
    .from('products')
    .insert({ user_id: userId, ...input })
  if (error) throw new Error(error.message)
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
