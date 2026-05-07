-- Add extended fields to customers table for PM requirements
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS contact_person TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tags           TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS billing_address  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS credit_term    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS salesperson    TEXT NOT NULL DEFAULT '';
