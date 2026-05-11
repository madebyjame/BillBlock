import { supabase } from './supabase'

// ─── Categories ───────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { value: 'rent',        label: 'ค่าเช่า',               color: 'bg-purple-100 text-purple-700' },
  { value: 'utilities',   label: 'ค่าสาธารณูปโภค',       color: 'bg-blue-100 text-blue-700' },
  { value: 'salary',      label: 'ค่าแรง/เงินเดือน',     color: 'bg-green-100 text-green-700' },
  { value: 'supplies',    label: 'ค่าวัสดุสิ้นเปลือง',   color: 'bg-amber-100 text-amber-700' },
  { value: 'transport',   label: 'ค่าขนส่ง/เดินทาง',     color: 'bg-orange-100 text-orange-700' },
  { value: 'marketing',   label: 'ค่าโฆษณา/การตลาด',     color: 'bg-pink-100 text-pink-700' },
  { value: 'maintenance', label: 'ค่าซ่อมบำรุง',          color: 'bg-red-100 text-red-700' },
  { value: 'other',       label: 'อื่นๆ',                  color: 'bg-slate-100 text-slate-700' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']

export function getCategoryMeta(value: string) {
  return EXPENSE_CATEGORIES.find(c => c.value === value) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpenseRow {
  id: string
  user_id: string
  amount: number
  category: ExpenseCategory
  expense_date: string
  vendor: string | null
  note: string | null
  created_at: string
}

export interface CreateExpenseInput {
  amount: number
  category: ExpenseCategory
  expense_date: string
  vendor?: string
  note?: string
}

export interface ExpenseSummaryRow {
  month_key: string
  total_expenses: number
  expense_count: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function listExpenses(
  userId: string,
  from?: string,
  to?: string,
): Promise<ExpenseRow[]> {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (from) query = query.gte('expense_date', from)
  if (to)   query = query.lte('expense_date', to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ExpenseRow[]
}

export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ user_id: userId, ...input })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ExpenseRow
}

export async function updateExpense(
  id: string,
  input: Partial<CreateExpenseInput>,
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getExpenseSummary(
  dateFrom: string,
  dateTo: string,
): Promise<ExpenseSummaryRow[]> {
  const { data, error } = await supabase
    .rpc('get_expense_summary', { p_date_from: dateFrom, p_date_to: dateTo })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: Record<string, unknown>) => ({
    month_key:      String(r.month_key),
    total_expenses: Number(r.total_expenses),
    expense_count:  Number(r.expense_count),
  }))
}
