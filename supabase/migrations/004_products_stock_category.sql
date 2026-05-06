-- ============================================================
-- Migration 004: add stock + category columns to products
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

alter table public.products
  add column if not exists stock    integer     not null default 0,
  add column if not exists category text        not null default '';
