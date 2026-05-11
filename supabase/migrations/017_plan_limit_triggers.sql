-- ============================================================
-- Migration 017: Server-side plan limit enforcement via triggers
-- Complements client-side checkPlanLimit() in planLimits.ts.
-- Triggers run as SECURITY DEFINER to bypass RLS for counting.
-- ============================================================

-- ─── Helper: get numeric limit for a plan + resource ─────────────────────────

create or replace function public.plan_row_limit(
  p_plan     text,
  p_resource text   -- 'documents' | 'customers' | 'products'
)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'business' then null  -- null = unlimited
    when 'pro' then
      case p_resource
        when 'documents' then 100
        when 'customers' then 50
        when 'products'  then 50
        else null
      end
    else  -- 'free' or anything unknown
      case p_resource
        when 'documents' then 5
        when 'customers' then 5
        when 'products'  then 5
        else null
      end
  end;
$$;

-- ─── Trigger function: documents ─────────────────────────────────────────────
-- Counts docs created in the current calendar month for this user.

create or replace function public.enforce_plan_limit_documents()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan  text;
  v_limit int;
  v_count int;
begin
  v_plan  := public.get_user_plan(new.user_id);
  v_limit := public.plan_row_limit(v_plan, 'documents');

  if v_limit is null then
    return new;  -- unlimited plan
  end if;

  select count(*)
    into v_count
    from public.documents
   where user_id   = new.user_id
     and created_at >= date_trunc('month', now() at time zone 'UTC');

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT:documents:% (plan=%, used=%)', v_limit, v_plan, v_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_plan_documents on public.documents;
create trigger trg_enforce_plan_documents
  before insert on public.documents
  for each row execute function public.enforce_plan_limit_documents();

-- ─── Trigger function: customers ─────────────────────────────────────────────

create or replace function public.enforce_plan_limit_customers()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan  text;
  v_limit int;
  v_count int;
begin
  v_plan  := public.get_user_plan(new.user_id);
  v_limit := public.plan_row_limit(v_plan, 'customers');

  if v_limit is null then
    return new;
  end if;

  select count(*)
    into v_count
    from public.customers
   where user_id = new.user_id;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT:customers:% (plan=%, used=%)', v_limit, v_plan, v_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_plan_customers on public.customers;
create trigger trg_enforce_plan_customers
  before insert on public.customers
  for each row execute function public.enforce_plan_limit_customers();

-- ─── Trigger function: products ──────────────────────────────────────────────

create or replace function public.enforce_plan_limit_products()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan  text;
  v_limit int;
  v_count int;
begin
  v_plan  := public.get_user_plan(new.user_id);
  v_limit := public.plan_row_limit(v_plan, 'products');

  if v_limit is null then
    return new;
  end if;

  select count(*)
    into v_count
    from public.products
   where user_id = new.user_id;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT:products:% (plan=%, used=%)', v_limit, v_plan, v_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_plan_products on public.products;
create trigger trg_enforce_plan_products
  before insert on public.products
  for each row execute function public.enforce_plan_limit_products();

-- ─── Client error handling note ──────────────────────────────────────────────
-- When the trigger fires, Supabase returns:
--   { error: { code: 'P0001', message: 'PLAN_LIMIT:documents:5 ...' } }
-- The existing PlanLimitError parser in planLimits.ts already matches
-- 'PLAN_LIMIT:resource:limit' — no client changes needed.
