-- Saved signatures per user (plan-gated)
CREATE TABLE IF NOT EXISTS signatures (
  id         uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text         NOT NULL DEFAULT 'ลายเซ็น',
  url        text         NOT NULL,
  is_default boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signatures_user_id_idx ON signatures (user_id);

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_signatures" ON signatures
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function: revoke anon/service_role from calling directly
REVOKE ALL ON TABLE signatures FROM anon;
GRANT  ALL ON TABLE signatures TO authenticated;
