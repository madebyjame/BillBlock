-- ============================================================
-- Migration 002: profiles table + RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Create table (safe to run even if it already exists)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default '',
  address      text not null default '',
  tax_id       text not null default '',
  phone        text not null default '',
  email        text not null default '',
  updated_at   timestamptz not null default now()
);

-- 2. Add missing columns if the table already existed without them
--    (safe: "if not exists" means it's a no-op when column is present)
alter table public.profiles
  add column if not exists company_name text not null default '',
  add column if not exists address      text not null default '',
  add column if not exists tax_id       text not null default '',
  add column if not exists phone        text not null default '',
  add column if not exists email        text not null default '',
  add column if not exists updated_at   timestamptz not null default now();

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;

-- 4. Drop & recreate policies (idempotent)
drop policy if exists "profiles: select own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);
