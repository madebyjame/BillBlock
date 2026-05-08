-- ─── portal_tokens ────────────────────────────────────────────────────────────
CREATE TABLE portal_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON portal_tokens(token);
CREATE INDEX ON portal_tokens(customer_id);

ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON portal_tokens USING (user_id = auth.uid());

-- ─── documents: add customer FK + due/paid dates + omise charge id ────────────
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS customer_id     uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date        date,
  ADD COLUMN IF NOT EXISTS paid_date       date,
  ADD COLUMN IF NOT EXISTS omise_charge_id text;

CREATE INDEX IF NOT EXISTS documents_customer_id_idx ON documents(customer_id);
CREATE INDEX IF NOT EXISTS documents_due_date_idx    ON documents(due_date)
  WHERE status IN ('sent', 'overdue');

-- ─── omise_customers: Omise customer token per user×customer ─────────────────
CREATE TABLE omise_customers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id       uuid REFERENCES customers(id) ON DELETE SET NULL,
  omise_customer_id text NOT NULL,
  card_last_four    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

ALTER TABLE omise_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON omise_customers USING (user_id = auth.uid());

-- ─── get_portal_data: public read via token (bypasses RLS) ───────────────────
CREATE OR REPLACE FUNCTION get_portal_data(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_token  portal_tokens;
  v_result jsonb;
BEGIN
  SELECT * INTO v_token FROM portal_tokens WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'token_expired');
  END IF;

  SELECT jsonb_build_object(
    'customer', row_to_json(c),
    'documents', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id',            d.id,
          'doc_type',      d.doc_type,
          'status',        d.status,
          'total_amount',  d.total_amount,
          'due_date',      d.due_date,
          'paid_date',     d.paid_date,
          'created_at',    d.created_at,
          'doc_number',    d.content->'docMeta'->>'number',
          'content',       d.content
        ) ORDER BY d.created_at DESC
      ) FROM documents d
        WHERE d.customer_id = v_token.customer_id
          AND d.user_id = v_token.user_id
      ), '[]'::jsonb
    ),
    'company', (
      SELECT jsonb_build_object(
        'company_name', p.company_name,
        'logo_url',     p.logo_url
      ) FROM profiles p WHERE p.id = v_token.user_id LIMIT 1
    )
  ) INTO v_result
  FROM customers c
  WHERE c.id = v_token.customer_id;

  RETURN v_result;
END;
$$;
