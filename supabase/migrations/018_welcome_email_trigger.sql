-- ============================================================
-- Migration 018: Send welcome email on new user signup
-- Requires: pg_net extension + send-email Edge Function deployed
-- ============================================================

-- Enable pg_net if not already (available on all Supabase projects)
create extension if not exists pg_net with schema extensions;

-- Trigger function: fires on new row in public.profiles
create or replace function public.send_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user_email  text;
  v_display_name text;
  v_supabase_url text := current_setting('app.supabase_url', true);
  v_service_key  text := current_setting('app.service_role_key', true);
begin
  -- Get email from auth.users
  select email, raw_user_meta_data->>'full_name'
    into v_user_email, v_display_name
    from auth.users
   where id = new.id;

  if v_user_email is null then
    return new;
  end if;

  -- Call send-email Edge Function via pg_net (fire-and-forget)
  perform extensions.http_post(
    url     := v_supabase_url || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := jsonb_build_object(
      'type', 'welcome',
      'to',   v_user_email,
      'data', jsonb_build_object('displayName', coalesce(v_display_name, ''))
    )
  );

  return new;
exception when others then
  -- Never block signup if email fails
  raise warning 'send_welcome_email failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists trg_send_welcome_email on public.profiles;
create trigger trg_send_welcome_email
  after insert on public.profiles
  for each row execute function public.send_welcome_email();

-- ─── Required: set app config vars in Supabase Dashboard ─────────────────────
-- SQL Editor → run once:
--   alter database postgres set app.supabase_url = 'https://<project>.supabase.co';
--   alter database postgres set app.service_role_key = '<service_role_key>';
-- (service_role_key is in Project Settings → API)
