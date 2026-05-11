-- ─── Function: get_ar_aging ──────────────────────────────────────────────────
-- Returns outstanding invoices/billing-notes with days overdue and aging bucket.
-- Only includes docs with status='sent' and due_date set.

CREATE OR REPLACE FUNCTION get_ar_aging()
RETURNS TABLE (
  id           uuid,
  doc_type     text,
  doc_number   text,
  customer_name text,
  total_amount  numeric,
  due_date      date,
  days_overdue  int,
  bucket        text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.doc_type,
    d.content->'docMeta'->>'number'    AS doc_number,
    d.content->'customer'->>'name'     AS customer_name,
    d.total_amount,
    d.due_date::date                   AS due_date,
    (CURRENT_DATE - d.due_date::date)::int AS days_overdue,
    CASE
      WHEN (CURRENT_DATE - d.due_date::date) <= 30 THEN '0-30'
      WHEN (CURRENT_DATE - d.due_date::date) <= 60 THEN '31-60'
      WHEN (CURRENT_DATE - d.due_date::date) <= 90 THEN '61-90'
      ELSE '90+'
    END AS bucket
  FROM documents d
  WHERE d.user_id  = auth.uid()
    AND d.status   = 'sent'
    AND d.doc_type IN ('invoice', 'billing-note')
    AND d.due_date IS NOT NULL
  ORDER BY days_overdue DESC;
$$;

-- ─── Function: get_sales_by_product ──────────────────────────────────────────
-- Aggregates paid invoice/receipt/tax-invoice line items by product.
-- Joins with products table to get cost_price for COGS calculation.
-- Items without product_id (manual lines) are grouped by description.

CREATE OR REPLACE FUNCTION get_sales_by_product(
  p_date_from date,
  p_date_to   date
)
RETURNS TABLE (
  product_id    text,
  product_name  text,
  quantity_sold numeric,
  revenue       numeric,
  cogs          numeric,
  gross_profit  numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(item->>'product_id', 'manual')          AS product_id,
    COALESCE(NULLIF(item->>'description',''), 'รายการไม่ระบุ') AS product_name,
    SUM((item->>'quantity')::numeric)                 AS quantity_sold,
    SUM(
      (item->>'quantity')::numeric
      * COALESCE(NULLIF(item->>'unitPrice','0'),'0')::numeric
    )                                                 AS revenue,
    SUM(
      (item->>'quantity')::numeric
      * COALESCE(p.cost_price, 0)
    )                                                 AS cogs,
    SUM(
      (item->>'quantity')::numeric
      * COALESCE(NULLIF(item->>'unitPrice','0'),'0')::numeric
    )
    - SUM(
      (item->>'quantity')::numeric
      * COALESCE(p.cost_price, 0)
    )                                                 AS gross_profit
  FROM documents d
  CROSS JOIN LATERAL jsonb_array_elements(d.content->'items') AS item
  LEFT JOIN products p
         ON p.id       = (item->>'product_id')::uuid
        AND p.user_id  = auth.uid()
  WHERE d.user_id  = auth.uid()
    AND d.status   = 'paid'
    AND d.doc_type IN ('invoice', 'receipt', 'tax-invoice')
    AND d.created_at::date BETWEEN p_date_from AND p_date_to
    AND (item->>'quantity')::numeric > 0
    AND COALESCE(NULLIF(item->>'unitPrice',''),'0')::numeric > 0
  GROUP BY
    COALESCE(item->>'product_id', 'manual'),
    COALESCE(NULLIF(item->>'description',''), 'รายการไม่ระบุ')
  ORDER BY revenue DESC;
$$;
