import { supabase } from './supabase'
import { checkPlanLimit } from './planLimits'

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
  image_url: string
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
  image_url: string
}

const SELECT_FIELDS = 'id, user_id, name, price, unit, stock, category, sku, cost_price, min_stock, description, tax_type, image_url, created_at, updated_at'

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
  await checkPlanLimit(userId, 'products')

  const { data, error } = await supabase
    .from('products')
    .insert({ user_id: userId, ...input })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as ProductRow | null
}

export async function uploadProductImage(userId: string, productId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/products/${productId}.${ext}`
  const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('company-assets').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Compute committed quantities per product from sent (unpaid) invoices.
 * "Committed" = items on invoices with status='sent' that reference a product_id.
 * Requires LineItem.product_id to be populated (set since product_id was added to LineItem).
 */
export async function computeCommittedQtys(): Promise<Map<string, number>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Map()

  const { data } = await supabase
    .from('documents')
    .select('content')
    .eq('user_id', user.id)
    .eq('doc_type', 'invoice')
    .eq('status', 'sent')

  const map = new Map<string, number>()
  for (const doc of data ?? []) {
    const items = (doc.content as { items?: { product_id?: string; quantity?: number }[] })?.items ?? []
    for (const item of items) {
      if (item.product_id && item.quantity && item.quantity > 0) {
        map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity)
      }
    }
  }
  return map
}

/**
 * Compute monthly sales qty + revenue for a specific product from paid invoices.
 * Returns last N months chronologically.
 */
export async function getProductMonthlySales(
  productId: string,
  months = 6,
): Promise<{ label: string; qty: number; revenue: number }[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('documents')
    .select('content, created_at')
    .eq('user_id', user.id)
    .eq('doc_type', 'invoice')
    .eq('status', 'paid')

  const now = new Date()
  const buckets = new Map<string, { qty: number; revenue: number }>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, { qty: 0, revenue: 0 })
  }

  for (const doc of data ?? []) {
    const month = (doc.created_at as string).slice(0, 7)
    if (!buckets.has(month)) continue
    const items = (doc.content as { items?: { product_id?: string; quantity?: number; unitPrice?: number }[] })?.items ?? []
    for (const item of items) {
      if (item.product_id !== productId) continue
      const qty = item.quantity ?? 0
      const bucket = buckets.get(month)!
      bucket.qty += qty
      bucket.revenue += qty * (item.unitPrice ?? 0)
    }
  }

  return [...buckets.entries()].map(([key, val]) => {
    const [y, m] = key.split('-').map(Number)
    const label = new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'short' })
    return { label, ...val }
  })
}
