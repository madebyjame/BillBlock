-- ============================================================
-- Migration 006: add plan column to profiles table
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro', 'business'));
