-- Add document prefix columns for all doc types + PromptPay ID
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS receipt_prefix      TEXT NOT NULL DEFAULT 'REC',
  ADD COLUMN IF NOT EXISTS billing_note_prefix TEXT NOT NULL DEFAULT 'BN',
  ADD COLUMN IF NOT EXISTS tax_invoice_prefix  TEXT NOT NULL DEFAULT 'TAX',
  ADD COLUMN IF NOT EXISTS promptpay_id        TEXT NOT NULL DEFAULT '';
