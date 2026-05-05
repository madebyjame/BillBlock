-- ============================================================
-- Migration 003: customers + products tables + RLS policies
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1) customers
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default '',
  address    text not null default '',
  tax_id     text not null default '',
  email      text not null default '',
  phone      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_user_name_idx on public.customers(user_id, name);

alter table public.customers enable row level security;

drop policy if exists "customers: select own" on public.customers;
drop policy if exists "customers: insert own" on public.customers;
drop policy if exists "customers: update own" on public.customers;
drop policy if exists "customers: delete own" on public.customers;

create policy "customers: select own"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "customers: insert own"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "customers: update own"
  on public.customers for update
  using (auth.uid() = user_id);

create policy "customers: delete own"
  on public.customers for delete
  using (auth.uid() = user_id);

-- 2) products
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null default '',
  price      numeric(14, 2) not null default 0,
  unit       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists products_user_name_idx on public.products(user_id, name);

alter table public.products enable row level security;

drop policy if exists "products: select own" on public.products;
drop policy if exists "products: insert own" on public.products;
drop policy if exists "products: update own" on public.products;
drop policy if exists "products: delete own" on public.products;

create policy "products: select own"
  on public.products for select
  using (auth.uid() = user_id);

create policy "products: insert own"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "products: update own"
  on public.products for update
  using (auth.uid() = user_id);

create policy "products: delete own"
  on public.products for delete
  using (auth.uid() = user_id);
