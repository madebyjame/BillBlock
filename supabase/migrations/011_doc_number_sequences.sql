-- ─── Document Number Sequences ───────────────────────────────────────────────
-- Atomic counter per (user_id, doc_type, year) to prevent duplicate doc numbers
-- when two requests race to create a document simultaneously.

CREATE TABLE IF NOT EXISTS doc_number_sequences (
  user_id  uuid  REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doc_type text  NOT NULL,
  year     int   NOT NULL,
  last_val int   NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, doc_type, year)
);

ALTER TABLE doc_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_sequences" ON doc_number_sequences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE doc_number_sequences FROM anon;
GRANT ALL ON TABLE doc_number_sequences TO authenticated;

-- ─── Atomic increment function ────────────────────────────────────────────────
-- Returns the NEXT sequential number for a given user/type/year.
-- Uses INSERT ... ON CONFLICT DO UPDATE which is atomic in PostgreSQL.

CREATE OR REPLACE FUNCTION next_doc_number(
  p_user_id uuid,
  p_doc_type text,
  p_year    int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
BEGIN
  -- Verify caller is the owner
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO doc_number_sequences (user_id, doc_type, year, last_val)
  VALUES (p_user_id, p_doc_type, p_year, 1)
  ON CONFLICT (user_id, doc_type, year)
  DO UPDATE SET last_val = doc_number_sequences.last_val + 1
  RETURNING last_val INTO v_next;

  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION next_doc_number(uuid, text, int) TO authenticated;
