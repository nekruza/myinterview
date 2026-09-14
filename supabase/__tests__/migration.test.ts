/**
 * The migration is applied by hand in the Supabase SQL editor, so nothing in
 * CI ever executes it. These checks pin the security-relevant statements so a
 * later edit can't silently drop them.
 */
import { readFileSync } from "fs";
import { join } from "path";

const SQL = readFileSync(join(__dirname, "..", "migrations", "20260913000000_fina_web.sql"), "utf8");
const normalized = SQL.replace(/\s+/g, " ").toLowerCase();

const BILLING_COLUMNS = ["pro_status", "pro_current_period_end", "stripe_customer_id", "stripe_subscription_id"];

describe("profiles billing-column protection (C1)", () => {
  it("defines the guard function idempotently as security definer with a pinned search_path", () => {
    expect(normalized).toContain("create or replace function public.protect_profile_billing_columns()");
    expect(normalized).toMatch(/security definer/);
    expect(normalized).toMatch(/set search_path = public/);
  });

  it("recreates the trigger idempotently, before insert or update on profiles", () => {
    expect(normalized).toContain(
      "drop trigger if exists protect_profile_billing_columns on public.profiles"
    );
    expect(normalized).toContain(
      "create trigger protect_profile_billing_columns before insert or update on public.profiles for each row execute function public.protect_profile_billing_columns()"
    );
  });

  it("treats the service role and the dashboard/SQL-editor roles as privileged", () => {
    expect(normalized).toContain("coalesce(auth.role(), '') = 'service_role'");
    expect(normalized).toMatch(/session_user in \('postgres', 'supabase_admin', 'service_role'\)/);
  });

  it.each(BILLING_COLUMNS)("nulls %s on insert and pins it to the old value on update", (col) => {
    expect(normalized).toContain(`new.${col} := null;`);
    expect(normalized).toContain(`new.${col} := old.${col};`);
  });
});

describe("conversation_sessions delete policy", () => {
  it("lets a user delete only their own sessions", () => {
    expect(normalized).toContain('drop policy if exists "own conversations delete" on public.conversation_sessions;');
    expect(normalized).toContain(
      'create policy "own conversations delete" on public.conversation_sessions for delete using (auth.uid() = user_id);'
    );
  });
});

describe("vocabulary_generation_events (I2)", () => {
  it("creates the append-only events table with a cascade to auth.users", () => {
    expect(normalized).toContain(
      "create table if not exists public.vocabulary_generation_events ( id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now() );"
    );
    expect(normalized).toContain("on public.vocabulary_generation_events (user_id)");
    expect(normalized).toContain("alter table public.vocabulary_generation_events enable row level security;");
  });

  it("allows select and insert of own rows only", () => {
    expect(normalized).toContain(
      'create policy "own generation events select" on public.vocabulary_generation_events for select using (auth.uid() = user_id);'
    );
    expect(normalized).toContain(
      'create policy "own generation events insert" on public.vocabulary_generation_events for insert with check (auth.uid() = user_id);'
    );
  });

  it("has no update or delete policy, so the count cannot be reset from the client", () => {
    const eventPolicies = normalized.match(/create policy "[^"]+" on public\.vocabulary_generation_events for (\w+)/g) ?? [];
    const commands = eventPolicies.map((p) => p.split(" for ").pop());
    expect(commands.sort()).toEqual(["insert", "select"]);
  });
});
