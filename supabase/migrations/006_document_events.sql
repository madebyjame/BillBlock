-- ============================================================
-- Migration 006: document_events table (Document Timeline)
-- ============================================================

create table if not exists public.document_events (
  id           uuid        primary key default gen_random_uuid(),
  document_id  uuid        not null references public.documents(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  event_type   text        not null,
  -- event_type: 'status_changed' | 'exported_pdf' | 'saved'
  old_value    text,
  new_value    text,
  created_at   timestamptz not null default now()
);

create index if not exists document_events_document_id_idx on public.document_events(document_id);
create index if not exists document_events_user_id_idx     on public.document_events(user_id);

alter table public.document_events enable row level security;

drop policy if exists "document_events: select own" on public.document_events;
drop policy if exists "document_events: insert own" on public.document_events;

create policy "document_events: select own"
  on public.document_events for select
  using (auth.uid() = user_id);

create policy "document_events: insert own"
  on public.document_events for insert
  with check (auth.uid() = user_id);
