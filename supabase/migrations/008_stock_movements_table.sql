-- Stock Movement Ledger — records every IN / OUT / ADJUST transaction
CREATE TABLE IF NOT EXISTS stock_movements (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id         UUID        NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  movement_type      TEXT        NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST')),
  quantity           INTEGER     NOT NULL CHECK (quantity > 0),
  balance_after      INTEGER     NOT NULL,
  reference_document TEXT        NOT NULL DEFAULT '',
  note               TEXT        NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by         TEXT        NOT NULL DEFAULT ''
);

-- Index for fast per-product history lookups
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_user_idx    ON stock_movements (user_id,    created_at DESC);

-- Row-Level Security
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stock movements"
  ON stock_movements FOR ALL
  USING (auth.uid() = user_id);
