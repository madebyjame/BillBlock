-- ============================================================
-- Migration 001: documents table + RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Create table (safe to run even if it already exists)
create table if not exists public.documents (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  doc_type    text        not null default 'quotation',
  status      text        not null default 'draft'
                check (status in ('draft', 'sent', 'paid', 'cancelled')),
  total_amount numeric(14, 2) not null default 0,
  content     jsonb       not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.documents enable row level security;

-- 3. Drop & recreate policies (idempotent)
drop policy if exists "documents: select own" on public.documents;
drop policy if exists "documents: insert own" on public.documents;
drop policy if exists "documents: update own" on public.documents;
drop policy if exists "documents: delete own" on public.documents;

create policy "documents: select own"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "documents: insert own"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "documents: update own"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "documents: delete own"
  on public.documents for delete
  using (auth.uid() = user_id);
