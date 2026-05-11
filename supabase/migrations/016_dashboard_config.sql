ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_config jsonb DEFAULT NULL;
