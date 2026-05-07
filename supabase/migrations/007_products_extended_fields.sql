-- Add inventory-related fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cost_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tax_type    TEXT NOT NULL DEFAULT 'vat_included';

-- Optional: unique index on SKU per user (skip if SKU can be blank)
-- CREATE UNIQUE INDEX IF NOT EXISTS products_user_sku_idx ON products (user_id, sku) WHERE sku <> '';
