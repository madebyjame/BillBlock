-- ============================================================
-- Migration 005: add settings columns to profiles table
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

alter table public.profiles
  add column if not exists website              text    not null default '',
  add column if not exists logo_url             text    not null default '',
  add column if not exists signature_url        text    not null default '',
  add column if not exists theme_color          text    not null default '#1e3a8a',
  add column if not exists invoice_prefix       text    not null default 'INV',
  add column if not exists quotation_prefix     text    not null default 'QT',
  add column if not exists bank_name            text    not null default '',
  add column if not exists bank_branch          text    not null default '',
  add column if not exists bank_account_name    text    not null default '',
  add column if not exists bank_account_number  text    not null default '',
  add column if not exists bank_note            text    not null default '',
  add column if not exists vat_type             text    not null default 'none',
  add column if not exists credit_days          integer not null default 30;

-- ============================================================
-- NOTE: Also create a Supabase Storage bucket manually:
--   Supabase Dashboard → Storage → New bucket
--   Name: company-assets
--   Public: YES (toggled ON)
--
-- This bucket stores logo and signature images uploaded from
-- the Settings → หน้าตาเอกสาร tab.
-- ============================================================
