-- ─── Expenses table ──────────────────────────────────────────────────────────
-- Stores operating expenses for P&L net profit calculation.
-- Categories: rent, utilities, salary, supplies, transport, marketing, maintenance, other

CREATE TABLE IF NOT EXISTS expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       numeric(14,2) NOT NULL CHECK (amount > 0),
  category     text NOT NULL DEFAULT 'other',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor       text,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: owner only"
  ON expenses FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS expenses_user_id_idx   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx       ON expenses(expense_date);

-- ─── Function: get_expense_summary ───────────────────────────────────────────
-- Returns monthly expense totals grouped by month for P&L report.

CREATE OR REPLACE FUNCTION get_expense_summary(
  p_date_from date,
  p_date_to   date
)
RETURNS TABLE (
  month_key      text,
  total_expenses numeric,
  expense_count  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(expense_date, 'YYYY-MM') AS month_key,
    SUM(amount)                      AS total_expenses,
    COUNT(*)                         AS expense_count
  FROM expenses
  WHERE user_id     = auth.uid()
    AND expense_date BETWEEN p_date_from AND p_date_to
  GROUP BY to_char(expense_date, 'YYYY-MM')
  ORDER BY month_key;
$$;
