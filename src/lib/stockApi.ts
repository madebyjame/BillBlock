import { supabase } from './supabase'

export type MovementType = 'IN' | 'OUT' | 'ADJUST'

export interface StockMovementRow {
  id: string
  user_id: string
  product_id: string
  movement_type: MovementType
  quantity: number
  balance_after: number
  reference_document: string
  note: string
  created_at: string
  created_by: string
}

export interface RecordMovementInput {
  product_id: string
  movement_type: MovementType
  quantity: number
  reference_document?: string
  note: string
}

/**
 * Core stock-ledger function.
 * 1. Reads current product.stock
 * 2. Computes balance_after
 * 3. Inserts a StockMovement row
 * 4. Updates products.stock
 *
 * Both writes happen sequentially; Supabase does not expose client-side
 * transactions, so we check balance first to avoid negative stock.
 */
export async function recordStockMovement(input: RecordMovementInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('stock')
    .eq('id', input.product_id)
    .eq('user_id', user.id)
    .single()
  if (pErr || !product) throw new Error(pErr?.message ?? 'ไม่พบสินค้า')

  const current = (product as { stock: number }).stock
  const delta = input.movement_type === 'OUT' ? -input.quantity : input.quantity
  const balanceAfter = current + delta
  if (balanceAfter < 0) throw new Error('สต็อกไม่เพียงพอสำหรับการตัดออก')

  const { error: mErr } = await supabase.from('stock_movements').insert({
    user_id:            user.id,
    product_id:         input.product_id,
    movement_type:      input.movement_type,
    quantity:           input.quantity,
    balance_after:      balanceAfter,
    reference_document: input.reference_document ?? '',
    note:               input.note,
    created_by:         user.email ?? user.id,
  })
  if (mErr) throw new Error(mErr.message)

  const { error: uErr } = await supabase
    .from('products')
    .update({ stock: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', input.product_id)
  if (uErr) throw new Error(uErr.message)
}

export async function listMovementsByProduct(productId: string): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as StockMovementRow[]
}

export async function listAllMovements(): Promise<StockMovementRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as StockMovementRow[]
}

// ─── Auto-deduction helpers (call from EditorPage on status change) ───────────

interface DocLineItem {
  product_id?: string
  qty: number
}

/**
 * Deduct stock for every line item when a Receipt or Tax Invoice is finalised.
 * Pass docItems parsed from document.content.items.
 */
export async function deductStockForDocument(
  docItems: DocLineItem[],
  referenceDocument: string,
): Promise<void> {
  for (const item of docItems) {
    if (!item.product_id || item.qty <= 0) continue
    await recordStockMovement({
      product_id:         item.product_id,
      movement_type:      'OUT',
      quantity:           item.qty,
      reference_document: referenceDocument,
      note:               `ตัดสต็อกอัตโนมัติจากเอกสาร ${referenceDocument}`,
    })
  }
}

/**
 * Restore stock when a Receipt or Tax Invoice is cancelled.
 */
export async function restoreStockForDocument(
  docItems: DocLineItem[],
  referenceDocument: string,
): Promise<void> {
  for (const item of docItems) {
    if (!item.product_id || item.qty <= 0) continue
    await recordStockMovement({
      product_id:         item.product_id,
      movement_type:      'IN',
      quantity:           item.qty,
      reference_document: referenceDocument,
      note:               `คืนสต็อกอัตโนมัติ ยกเลิกเอกสาร ${referenceDocument}`,
    })
  }
}
