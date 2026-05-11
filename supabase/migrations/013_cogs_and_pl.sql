-- ─── COGS snapshot column ────────────────────────────────────────────────────
-- Stores calculated Cost of Goods Sold per document.
-- Populated (or refreshed) whenever a document is marked as "paid".
-- NULL = not yet calculated / document has no product lines with cost_price.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS cogs_amount numeric(14,2) DEFAULT 0;

-- ─── Function: refresh_doc_cogs ──────────────────────────────────────────────
-- Calculates COGS for one document by joining its JSON line items with
-- products.cost_price, then writes the result back to documents.cogs_amount.
--
-- Formula: Σ (item.quantity × products.cost_price)  for items that have product_id
--
-- Must be called by the application after a document is saved or paid.

CREATE OR REPLACE FUNCTION refresh_doc_cogs(p_doc_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cogs    numeric(14,2) := 0;
BEGIN
  -- Verify caller owns this document
  SELECT user_id INTO v_user_id
  FROM documents
  WHERE id = p_doc_id;

  IF v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Sum cost_price × quantity for each line item that references a product
  SELECT COALESCE(SUM(
    (item->>'quantity')::numeric
    * COALESCE(p.cost_price, 0)
  ), 0)
  INTO v_cogs
  FROM documents d,
       jsonb_array_elements(d.content->'items') AS item
  LEFT JOIN products p
         ON p.id = (item->>'product_id')::uuid
        AND p.user_id = v_user_id
  WHERE d.id = p_doc_id;

  -- Write snapshot back
  UPDATE documents
  SET cogs_amount = v_cogs
  WHERE id = p_doc_id;

  RETURN v_cogs;
END;
$$;

-- ─── Function: get_pl_summary ─────────────────────────────────────────────────
-- Returns monthly P&L summary for the calling user.
-- Revenue  = total_amount of paid docs (invoice / receipt / tax-invoice)
-- COGS     = cogs_amount of the same paid docs
-- Expenses = 0 (expense module not yet built)

CREATE OR REPLACE FUNCTION get_pl_summary(
  p_date_from date,
  p_date_to   date
)
RETURNS TABLE (
  month_key    text,        -- 'YYYY-MM'
  revenue      numeric,
  cogs         numeric,
  gross_profit numeric,
  doc_count    bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') AS month_key,
    SUM(total_amount)                                           AS revenue,
    SUM(COALESCE(cogs_amount, 0))                              AS cogs,
    SUM(total_amount) - SUM(COALESCE(cogs_amount, 0))          AS gross_profit,
    COUNT(*)                                                    AS doc_count
  FROM documents
  WHERE user_id  = auth.uid()
    AND status   = 'paid'
    AND doc_type IN ('invoice', 'receipt', 'tax-invoice')
    AND created_at::date BETWEEN p_date_from AND p_date_to
  GROUP BY to_char(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')
  ORDER BY month_key;
$$;
