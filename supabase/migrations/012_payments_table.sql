-- ─── Payments Table ──────────────────────────────────────────────────────────
-- Tracks partial and full payments against documents (invoices / receipts).
-- Supports split payments: multiple payments per document until total_amount is met.

CREATE TABLE IF NOT EXISTS payments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id   uuid        REFERENCES documents(id)  ON DELETE CASCADE NOT NULL,
  amount        numeric(14,2) NOT NULL CHECK (amount > 0),
  method        text        NOT NULL DEFAULT 'transfer',  -- 'cash' | 'transfer' | 'cheque' | 'other'
  paid_at       date        NOT NULL DEFAULT CURRENT_DATE,
  wht_rate      numeric(5,2) DEFAULT 0,   -- 0 | 1 | 2 | 3 (percent)
  wht_amount    numeric(14,2) DEFAULT 0,
  note          text        DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_payments" ON payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE payments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE payments TO authenticated;

-- Index for fast lookup per document
CREATE INDEX IF NOT EXISTS payments_document_id_idx ON payments (document_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments (user_id);

-- ─── Function: total paid per document ───────────────────────────────────────
-- Returns sum of payments for a given document_id.
CREATE OR REPLACE FUNCTION get_paid_amount(p_document_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE document_id = p_document_id
    AND user_id = auth.uid();
$$;
