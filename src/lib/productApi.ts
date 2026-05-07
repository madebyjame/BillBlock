import { supabase } from './supabase'

export interface ProductRow {
  id: string
  user_id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  sku: string
  cost_price: number
  min_stock: number
  description: string
  tax_type: string
  created_at?: string
  updated_at?: string
}

export interface ProductInput {
  name: string
  price: number
  unit: string
  stock: number
  category: string
  sku: string
  cost_price: number
  min_stock: number
  description: string
  tax_type: string
}

const SELECT_FIELDS = 'id, user_id, name, price, unit, stock, category, sku, cost_price, min_stock, description, tax_type, created_at, updated_at'

export async function listProducts(): Promise<ProductRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_FIELDS)
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ProductRow[]
}

export async function createProduct(userId: string, input: ProductInput): Promise<string> {
  const { data, error } = await supabase
    .from('products')
    .insert({ user_id: userId, ...input })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
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
