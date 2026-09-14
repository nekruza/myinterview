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
