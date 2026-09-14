-- Run in the Supabase SQL editor of Fina's project. Additive and idempotent.

alter table public.profiles
  add column if not exists native_language text,
  add column if not exists tutor_id text,
  add column if not exists ai_consent_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists pro_status text,
  add column if not exists pro_current_period_end timestamptz;

create index if not exists profiles_stripe_subscription_id_idx on public.profiles (stripe_subscription_id);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roleplay_id text not null,
  roleplay_title text not null,
  tutor_id text not null,
  language text not null,
  level text not null,
  status text not null default 'active' check (status in ('active','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  overall_score integer check (overall_score between 0 and 100),
  analysis jsonb,
  message_count integer
);
create index if not exists conversation_sessions_user_started_idx on public.conversation_sessions (user_id, started_at desc);
alter table public.conversation_sessions enable row level security;
drop policy if exists "own conversations select" on public.conversation_sessions;
drop policy if exists "own conversations insert" on public.conversation_sessions;
drop policy if exists "own conversations update" on public.conversation_sessions;
create policy "own conversations select" on public.conversation_sessions for select using (auth.uid() = user_id);
create policy "own conversations insert" on public.conversation_sessions for insert with check (auth.uid() = user_id);
create policy "own conversations update" on public.conversation_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Own-row delete for conversation_sessions.
--
-- DELETE /api/account removes the caller's rows with the RLS-scoped client.
-- Without a delete policy, RLS silently matches zero rows (no error), so the
-- sessions would outlive the account whenever the auth-user cascade can't run.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "own conversations delete" on public.conversation_sessions;
create policy "own conversations delete" on public.conversation_sessions for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Billing columns on profiles are server-owned.
--
-- Fina mobile writes `profiles` straight from the client, so the project has
-- an "update own row" RLS policy (left untouched here). That policy would also
-- let any signed-in user PATCH `pro_status = 'active'` on their own row and
-- grant themselves Fina Pro. This trigger makes the four billing columns
-- writable only by privileged callers:
--   * the service role (Stripe webhook, verify-purchase, account deletion),
--     detected via the request JWT: auth.role() = 'service_role';
--   * direct database sessions from the SQL editor / dashboard, detected via
--     session_user.
-- For everyone else, INSERT forces the columns to null and UPDATE pins them to
-- their previous values; every other column is written as normal.
--
-- session_user, not current_user: the function is SECURITY DEFINER, and inside
-- a security-definer function current_user is the function *owner* (postgres),
-- which would make every caller look privileged. session_user is the role that
-- opened the connection ('authenticator' for all PostgREST traffic), so it
-- still distinguishes API requests from SQL-editor sessions.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
     or session_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.pro_status := null;
    new.pro_current_period_end := null;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
  else
    new.pro_status := old.pro_status;
    new.pro_current_period_end := old.pro_current_period_end;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_billing_columns on public.profiles;
create trigger protect_profile_billing_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_billing_columns();

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only log of AI vocabulary generations.
--
-- The free-generation allowance used to count rows in generated_lessons, which
-- the user can delete, so deleting lessons reset the limit. Each successful web
-- generation now appends a row here. Users may read and insert their own rows,
-- but there is deliberately NO update or delete policy, so the count can't be
-- lowered from the client. Rows go away only with the auth user (on delete
-- cascade), which is also how DELETE /api/account cleans them up.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.vocabulary_generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists vocabulary_generation_events_user_idx on public.vocabulary_generation_events (user_id);
alter table public.vocabulary_generation_events enable row level security;
drop policy if exists "own generation events select" on public.vocabulary_generation_events;
drop policy if exists "own generation events insert" on public.vocabulary_generation_events;
create policy "own generation events select" on public.vocabulary_generation_events for select using (auth.uid() = user_id);
create policy "own generation events insert" on public.vocabulary_generation_events for insert with check (auth.uid() = user_id);
