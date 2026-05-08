-- ============================================================
-- Migration 007: subscriptions table + RLS + get_user_plan()
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- 1. subscriptions table
create table if not exists public.subscriptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  plan                    text        not null check (plan in ('free', 'pro', 'business')),
  status                  text        not null check (status in ('active', 'trialing', 'cancelled', 'past_due')),
  current_period_start    timestamptz not null default now(),
  current_period_end      timestamptz,
  payment_gateway         text        not null default '' check (payment_gateway in ('', 'omise', 'stripe')),
  gateway_subscription_id text        not null default '',
  gateway_customer_id     text        not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx    on public.subscriptions(user_id);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);

-- 2. RLS — users read their own rows only; writes are service_role only (webhook)
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: select own" on public.subscriptions;

create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- 3. Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- 4. get_user_plan(uid) — returns active plan or 'free' as fallback
--    security definer so it runs as owner (bypasses RLS), safe to call from client
create or replace function public.get_user_plan(uid uuid)
returns text
language sql
security definer
stable
as $$
  select coalesce(
    (
      select plan
      from   public.subscriptions
      where  user_id = uid
        and  status in ('active', 'trialing')
        and  (current_period_end is null or current_period_end > now())
      order  by current_period_end desc nulls last
      limit  1
    ),
    'free'
  );
$$;

-- Grant execute to authenticated users
grant execute on function public.get_user_plan(uuid) to authenticated;
