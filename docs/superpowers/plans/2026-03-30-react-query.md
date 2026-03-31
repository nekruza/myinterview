# React Query Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TanStack React Query to all client components so API responses are cached, deduplicated, and automatically invalidated.

**Architecture:** Install React Query, mount a single `QueryClientProvider` inside `app/app/layout.tsx`, extract all client-side data fetching into typed hooks in `lib/queries/`, and replace raw `fetch`/`useEffect` patterns in four client components.

**Tech Stack:** `@tanstack/react-query` v5, Next.js App Router (client components only), Supabase browser client, Jest + `@testing-library/react`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/QueryProvider.tsx` | `"use client"` wrapper that mounts `QueryClientProvider` |
| Modify | `app/app/layout.tsx` | Wrap children with `QueryProvider` |
| Create | `lib/queries/keys.ts` | Central `QUERY_KEYS` constants |
| Create | `lib/queries/notifications.ts` | `useNotifications`, `useMarkNotificationsRead`, `useMarkAllNotificationsRead` |
| Create | `lib/queries/__tests__/notifications.test.tsx` | Tests for notification hooks |
| Create | `lib/queries/profile.ts` | `useProfile`, `useSettingsProfile` |
| Create | `lib/queries/__tests__/profile.test.tsx` | Tests for profile hooks |
| Create | `lib/queries/peer-sessions.ts` | `usePeerSessions`, `usePeerSession`, `useJoinPeerSession`, `useLeavePeerSession`, `useRespondToJoin`, `useCreatePeerSession` |
| Create | `lib/queries/__tests__/peer-sessions.test.tsx` | Tests for peer-session hooks |
| Create | `lib/queries/subscription.ts` | `useSubscription` |
| Create | `lib/queries/__tests__/subscription.test.tsx` | Tests for subscription hook |
| Modify | `app/app/AppSidebar.tsx` | Replace `useEffect`+raw fetch with `useNotifications` + `useProfile` |
| Modify | `app/app/peer-practice/page.tsx` | Replace `fetchSessions` `useEffect` with `usePeerSessions` + `useProfile` + mutations |
| Modify | `app/app/peer-practice/[id]/page.tsx` | Replace `fetchSession` `useEffect` with `usePeerSession` + mutations |
| Modify | `app/app/settings/page.tsx` | Replace Supabase `useEffect` with `useSettingsProfile` + `useSubscription` |

---

## Task 1: Install React Query

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @tanstack/react-query
```

Expected output: `added 1 package` (or similar), no peer-dep errors.

- [ ] **Step 2: Verify import resolves**

```bash
node -e "require('@tanstack/react-query'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @tanstack/react-query"
```

---

## Task 2: Create QueryProvider

**Files:**
- Create: `components/QueryProvider.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              if (
                error instanceof Error &&
                "status" in error &&
                typeof (error as { status: number }).status === "number"
              ) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/QueryProvider.tsx
git commit -m "feat: add QueryProvider component"
```

---

## Task 3: Mount QueryProvider in app layout

**Files:**
- Modify: `app/app/layout.tsx`

- [ ] **Step 1: Add the import and wrap children**

In `app/app/layout.tsx`, add the import after the existing imports:

```tsx
import { QueryProvider } from "@/components/QueryProvider";
```

Then in the JSX, wrap `{children}` inside `<main>`:

Replace:
```tsx
<div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-8">{children}</div>
```

With:
```tsx
<QueryProvider>
  <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-8">{children}</div>
</QueryProvider>
```

- [ ] **Step 2: Verify the app still builds**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/app/layout.tsx
git commit -m "feat: mount QueryProvider in app layout"
```

---

## Task 4: Create query keys

**Files:**
- Create: `lib/queries/keys.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/queries/keys.ts
export const QUERY_KEYS = {
  profile: ["profile"] as const,
  settingsProfile: ["settings-profile"] as const,
  notifications: ["notifications"] as const,
  peerSessions: ["peer-sessions"] as const,
  peerSession: (id: string) => ["peer-sessions", id] as const,
  subscription: ["subscription"] as const,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/queries/keys.ts
git commit -m "feat: add React Query key constants"
```

---

## Task 5: Create notifications hooks

**Files:**
- Create: `lib/queries/notifications.ts`
- Create: `lib/queries/__tests__/notifications.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * @jest-environment jsdom
 */
// lib/queries/__tests__/notifications.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useNotifications,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
} from "../notifications";

const mockNotification = {
  id: "n1",
  type: "join_request" as const,
  title: "New request",
  body: null,
  data: {},
  read: false,
  created_at: "2026-01-01T00:00:00Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useNotifications", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns notifications from /api/notifications", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notifications: [mockNotification] }),
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockNotification]);
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
  });
});

describe("useMarkNotificationsRead", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("PATCH /api/notifications with ids", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useMarkNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(["n1"]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["n1"] }),
    });
  });
});

describe("useMarkAllNotificationsRead", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("PATCH /api/notifications with all: true", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest lib/queries/__tests__/notifications.test.tsx --no-coverage 2>&1 | tail -15
```

Expected: `Cannot find module '../notifications'`

- [ ] **Step 3: Create the implementation**

```ts
// lib/queries/notifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";

export interface Notification {
  id: string;
  type: "join_request" | "join_accepted" | "join_rejected";
  title: string;
  body: string | null;
  data: {
    session_id?: string;
    session_title?: string;
    requester_id?: string;
    requester_name?: string;
  };
  read: boolean;
  created_at: string;
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch notifications"), { status: res.status });
  const data = await res.json();
  return data.notifications ?? [];
}

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: fetchNotifications,
    staleTime: 60 * 1000, // 1 minute — notifications are more time-sensitive
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw Object.assign(new Error("Failed to mark read"), { status: res.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw Object.assign(new Error("Failed to mark all read"), { status: res.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/queries/__tests__/notifications.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 3 passed, 3 total`

- [ ] **Step 5: Commit**

```bash
git add lib/queries/notifications.ts lib/queries/__tests__/notifications.test.tsx
git commit -m "feat: add notifications React Query hooks"
```

---

## Task 6: Create profile hooks

**Files:**
- Create: `lib/queries/profile.ts`
- Create: `lib/queries/__tests__/profile.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
/**
 * @jest-environment jsdom
 */
// lib/queries/__tests__/profile.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useProfile } from "../profile";
import type { UserProfile } from "@/lib/types/profile";

const mockProfile: UserProfile = {
  id: "u1",
  email: "user@test.com",
  full_name: "Test User",
  avatar_url: null,
  resume_url: null,
  created_at: "2026-01-01T00:00:00Z",
  experience_level: "mid",
  interview_timeline: null,
  target_companies: [],
  target_role: null,
  stats: { total_sessions: 5, ai_sessions: 5, peer_sessions: 0, current_streak: 2, longest_streak: 3, avg_score: 80, total_practice_minutes: 60 },
  confidence: { current_avg: 80, initial_avg: 70, trend: "improving", by_competency: {} },
  competency_scores: [],
  strongest_competency: null,
  weakest_competency: null,
  peer: { sessions_hosted: 0, sessions_joined: 0 },
  preferences: { email_notifications: true, match_alerts: true },
  plan: "free",
  practice_sessions_used: 2,
  peer_sessions_joined: 0,
  isAdmin: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProfile", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("fetches profile from /api/profile", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith("/api/profile");
  });

  it("throws on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest lib/queries/__tests__/profile.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module '../profile'`

- [ ] **Step 3: Create the implementation**

```ts
// lib/queries/profile.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";
import type { UserProfile } from "@/lib/types/profile";

// ── General profile (used by AppSidebar and peer-practice) ───────────────────

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch profile"), { status: res.status });
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: fetchProfile,
  });
}

// ── Settings profile (extended fields not in /api/profile) ───────────────────

export interface SettingsProfile {
  full_name: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  experience_level: string | null;
  interview_timeline: string | null;
  target_companies: string[] | null;
  email_notifications: boolean | null;
  match_alerts: boolean | null;
  interview_style: string | null;
  interview_duration: string | null;
  practice_partner: string | null;
  interview_language: string | null;
  interview_platform: string | null;
  feedback_preference: string | null;
  wants_tips: boolean | null;
}

async function fetchSettingsProfile(): Promise<SettingsProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, resume_url, experience_level, interview_timeline, target_companies, email_notifications, match_alerts, interview_style, interview_duration, practice_partner, interview_language, interview_platform, feedback_preference, wants_tips"
    )
    .eq("id", user.id)
    .single();
  return data ?? null;
}

export function useSettingsProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.settingsProfile,
    queryFn: fetchSettingsProfile,
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/queries/__tests__/profile.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 5: Commit**

```bash
git add lib/queries/profile.ts lib/queries/__tests__/profile.test.tsx
git commit -m "feat: add profile React Query hooks"
```

---

## Task 7: Create peer-sessions hooks

**Files:**
- Create: `lib/queries/peer-sessions.ts`
- Create: `lib/queries/__tests__/peer-sessions.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
/**
 * @jest-environment jsdom
 */
// lib/queries/__tests__/peer-sessions.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  usePeerSessions,
  usePeerSession,
  useJoinPeerSession,
  useLeavePeerSession,
  useRespondToJoin,
} from "../peer-sessions";

const mockSession = {
  id: "s1",
  host_id: "u1",
  title: "Test Session",
  scheduled_at: "2026-04-01T10:00:00Z",
  duration_minutes: 45,
  meeting_link: "https://meet.example.com",
  type: "peer",
  status: "open",
  notes: null,
  max_participants: 2,
  is_featured: false,
  created_at: "2026-01-01T00:00:00Z",
  developer_type: null,
  interview_type: null,
  host: { id: "u1", full_name: "Host", avatar_url: null },
  participants: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePeerSessions", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("fetches from /api/peer-sessions and returns { sessions, userId }", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessions: [mockSession], userId: "u2" }),
    });

    const { result } = renderHook(() => usePeerSessions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sessions).toEqual([mockSession]);
    expect(result.current.data?.userId).toBe("u2");
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions");
  });
});

describe("usePeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("fetches /api/peer-sessions/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ session: mockSession, userId: "u2" }),
    });

    const { result } = renderHook(() => usePeerSession("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.session).toEqual(mockSession);
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/s1");
  });
});

describe("useJoinPeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("POSTs to /api/peer-sessions/join", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useJoinPeerSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("s1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });
});

describe("useLeavePeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("DELETEs /api/peer-sessions/join", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useLeavePeerSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("s1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });
});

describe("useRespondToJoin", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("POSTs to /api/peer-sessions/join/respond", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useRespondToJoin("s1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ userId: "u2", action: "accept" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/peer-sessions/join/respond",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: "s1", user_id: "u2", action: "accept" }),
      }
    );
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest lib/queries/__tests__/peer-sessions.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module '../peer-sessions'`

- [ ] **Step 3: Create the implementation**

```ts
// lib/queries/peer-sessions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";

export interface PeerSessionProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  experience_level?: string | null;
}

export interface PeerSessionParticipant {
  user_id: string;
  joined_at: string;
  status: "pending" | "accepted" | "rejected";
  profile: PeerSessionProfile;
}

export interface PeerSession {
  id: string;
  host_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  type: string;
  status: string;
  notes: string | null;
  max_participants: number;
  is_featured: boolean;
  created_at: string;
  developer_type: string | null;
  interview_type: string | null;
  host: PeerSessionProfile;
  participants: PeerSessionParticipant[];
}

// ── Queries ──────────────────────────────────────────────────────────────────

async function fetchPeerSessions(): Promise<{ sessions: PeerSession[]; userId: string }> {
  const res = await fetch("/api/peer-sessions");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch sessions"), { status: res.status });
  return res.json();
}

export function usePeerSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.peerSessions,
    queryFn: fetchPeerSessions,
    staleTime: 30 * 1000, // 30 seconds — live-ish data
  });
}

async function fetchPeerSession(id: string): Promise<{ session: PeerSession; userId: string }> {
  const res = await fetch(`/api/peer-sessions/${id}`);
  if (!res.ok) throw Object.assign(new Error("Failed to fetch session"), { status: res.status });
  return res.json();
}

export function usePeerSession(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.peerSession(id),
    queryFn: () => fetchPeerSession(id),
    staleTime: 10 * 1000, // 10 seconds
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useJoinPeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/peer-sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to join"), { status: res.status, data });
      }
      return res.json();
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useLeavePeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/peer-sessions/join", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to leave"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useRespondToJoin(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "accept" | "reject" }) => {
      const res = await fetch("/api/peer-sessions/join/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, user_id: userId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || `Failed to ${action}`), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useCreatePeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      scheduled_at: string;
      duration_minutes?: number;
      meeting_link: string;
      type?: string;
      notes?: string | null;
      max_participants?: number;
      developer_type?: string | null;
      interview_type?: string | null;
    }) => {
      const res = await fetch("/api/peer-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to create session"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
    },
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/queries/__tests__/peer-sessions.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 5 passed, 5 total`

- [ ] **Step 5: Commit**

```bash
git add lib/queries/peer-sessions.ts lib/queries/__tests__/peer-sessions.test.tsx
git commit -m "feat: add peer-sessions React Query hooks"
```

---

## Task 8: Create subscription hook

**Files:**
- Create: `lib/queries/subscription.ts`
- Create: `lib/queries/__tests__/subscription.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * @jest-environment jsdom
 */
// lib/queries/__tests__/subscription.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSubscription } from "../subscription";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          plan: "pro",
          cancel_at_period_end: false,
          current_period_end: "2026-12-31T00:00:00Z",
        },
        error: null,
      }),
    })),
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSubscription", () => {
  it("returns subscription data from Supabase", async () => {
    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      plan: "pro",
      cancel_at_period_end: false,
      current_period_end: "2026-12-31T00:00:00Z",
    });
  });

  it("returns null when user has no subscription", async () => {
    const { createClient } = jest.requireMock("@/lib/supabase/client") as {
      createClient: jest.Mock;
    };
    createClient.mockReturnValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    });

    const { result } = renderHook(() => useSubscription(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx jest lib/queries/__tests__/subscription.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module '../subscription'`

- [ ] **Step 3: Create the implementation**

```ts
// lib/queries/subscription.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";

export interface Subscription {
  plan: "free" | "pro";
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}

async function fetchSubscription(): Promise<Subscription | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .single();
  return data ?? null;
}

export function useSubscription() {
  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: fetchSubscription,
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/queries/__tests__/subscription.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 5: Run all query hook tests together**

```bash
npx jest lib/queries/__tests__/ --no-coverage 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/queries/subscription.ts lib/queries/__tests__/subscription.test.tsx
git commit -m "feat: add subscription React Query hook"
```

---

## Task 9: Migrate AppSidebar

**Files:**
- Modify: `app/app/AppSidebar.tsx`

- [ ] **Step 1: Replace imports and state**

At the top of `app/app/AppSidebar.tsx`, replace:
```tsx
import { FC, useState, useEffect, useCallback } from "react";
```
with:
```tsx
import { FC, useState } from "react";
```

Remove the `createClient` import:
```tsx
import { createClient } from "@/lib/supabase/client";
```

Add the query hook imports after the existing imports:
```tsx
import { useNotifications, useMarkNotificationsRead, useMarkAllNotificationsRead } from "@/lib/queries/notifications";
import { useProfile } from "@/lib/queries/profile";
```

- [ ] **Step 2: Replace state and effects inside the component**

Inside `AppSidebar`, replace this block:
```tsx
const [notifications, setNotifications] = useState<Notification[]>([]);
const [popoverOpen, setPopoverOpen] = useState(false);
const [plan, setPlan] = useState<"free" | "pro" | null>(null);
const [practiceUsed, setPracticeUsed] = useState(0);

const unreadCount = notifications.filter((n) => !n.read).length;

const fetchNotifications = useCallback(async () => {
  const res = await fetch("/api/notifications");
  if (res.ok) {
    const data = await res.json();
    setNotifications(data.notifications || []);
  }
}, []);

useEffect(() => {
  fetchNotifications();
  fetch("/api/profile").then((r) => r.ok ? r.json() : null).then((data) => {
    if (data?.profile) {
      setPlan(data.profile.plan ?? "free");
      setPracticeUsed(data.profile.practice_sessions_used ?? 0);
    }
  });
}, [fetchNotifications]);
```

With:
```tsx
const [popoverOpen, setPopoverOpen] = useState(false);

const { data: notificationsData } = useNotifications();
const { data: profileData } = useProfile();
const markRead = useMarkNotificationsRead();
const markAllRead = useMarkAllNotificationsRead();

const notifications = notificationsData ?? [];
const plan = profileData?.plan ?? null;
const practiceUsed = profileData?.practice_sessions_used ?? 0;
const unreadCount = notifications.filter((n) => !n.read).length;
```

- [ ] **Step 3: Replace markAllRead and handleNotificationClick**

Replace:
```tsx
async function markAllRead() {
  await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
}

function handleNotificationClick(n: Notification) {
  if (!n.read) {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    });
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === n.id ? { ...notif, read: true } : notif
      )
    );
  }
  if (n.data.session_id) {
    setPopoverOpen(false);
    router.push(`/app/peer-practice/${n.data.session_id}`);
  }
}
```

With:
```tsx
function handleMarkAllRead() {
  markAllRead.mutate();
}

function handleNotificationClick(n: Notification) {
  if (!n.read) {
    markRead.mutate([n.id]);
  }
  if (n.data.session_id) {
    setPopoverOpen(false);
    router.push(`/app/peer-practice/${n.data.session_id}`);
  }
}
```

- [ ] **Step 4: Update JSX references**

In the JSX, replace:
```tsx
onClick={markAllRead}
```
with:
```tsx
onClick={handleMarkAllRead}
```

Also remove the now-unused `Notification` interface from the top of the file (it's now defined in `lib/queries/notifications.ts` and can be imported if needed — but since the component only uses the type locally in the JSX iteration, remove it and let TypeScript infer from the array).

Or alternatively, import it:
```tsx
import type { Notification } from "@/lib/queries/notifications";
```
and remove the local `interface Notification { ... }` block.

- [ ] **Step 5: Replace handleSignOut**

Replace:
```tsx
async function handleSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/");
  router.refresh();
}
```

With (createClient is still needed for sign-out — re-add the import):
```tsx
import { createClient } from "@/lib/supabase/client";
```

Keep `handleSignOut` as-is since it uses Supabase auth, not a query.

- [ ] **Step 6: Verify the build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/app/AppSidebar.tsx
git commit -m "feat: migrate AppSidebar to React Query hooks"
```

---

## Task 10: Migrate peer-practice/page.tsx

**Files:**
- Modify: `app/app/peer-practice/page.tsx`

- [ ] **Step 1: Add imports**

At the top of the file, add after existing imports:
```tsx
import { usePeerSessions, useJoinPeerSession, useLeavePeerSession, useCreatePeerSession } from "@/lib/queries/peer-sessions";
import { useProfile } from "@/lib/queries/profile";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
```

- [ ] **Step 2: Replace state and data loading**

Find and remove these state variables and their initialization from the component:
```tsx
const [loading, setLoading] = useState(true);
const [plan, setPlan] = useState<"free" | "pro">("free");
const [isAdmin, setIsAdmin] = useState(false);
const [joinsUsed, setJoinsUsed] = useState(0);
```

And remove the `fetchSessions` function and its `useEffect`:
```tsx
async function fetchSessions() {
  try {
    const [sessionsRes, profileRes] = await Promise.all([
      fetch("/api/peer-sessions"),
      fetch("/api/profile"),
    ]);
    const sessionsData = await sessionsRes.json();
    const profileData = await profileRes.json();
    setSessions(sessionsData.sessions ?? []);
    setUserId(sessionsData.userId ?? "");
    setPlan(profileData.plan ?? "free");
    setIsAdmin(profileData.isAdmin ?? false);
    setJoinsUsed(profileData.peer_sessions_joined ?? 0);
  } catch {
    toast.error("Failed to load sessions");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  fetchSessions();
}, []);
```

Replace with:
```tsx
const { data: sessionsData, isLoading: sessionsLoading } = usePeerSessions();
const { data: profileData, isLoading: profileLoading } = useProfile();
const joinMutation = useJoinPeerSession();
const leaveMutation = useLeavePeerSession();
const createMutation = useCreatePeerSession();
const queryClient = useQueryClient();

const loading = sessionsLoading || profileLoading;
const sessions = sessionsData?.sessions ?? [];
const userId = sessionsData?.userId ?? "";
const plan = profileData?.plan ?? "free";
const isAdmin = profileData?.isAdmin ?? false;
const joinsUsed = profileData?.peer_sessions_joined ?? 0;
```

Note: remove the `useState` for `sessions` and `userId` if they were only used as loading destinations — they now come from the query data. Keep any other `useState` that holds UI state (dialogOpen, joiningId, etc.).

- [ ] **Step 3: Replace handleJoin**

Replace:
```tsx
async function handleJoin(sessionId: string) {
  if (plan === "free" && joinsUsed >= 3) {
    setShowUpgrade(true);
    return;
  }
  setJoiningId(sessionId);
  try {
    const res = await fetch("/api/peer-sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (res.status === 403) {
      const data = await res.json();
      if (data.error === "limit_reached") {
        setShowUpgrade(true);
        return;
      }
      throw new Error(data.error || "Failed to join");
    }
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to join");
    }
    setJoinsUsed((prev) => prev + 1);
    toast.success("Join request sent! The host will review it.");
    fetchSessions();
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : "Failed to join session");
  } finally {
    setJoiningId(null);
  }
}
```

With:
```tsx
async function handleJoin(sessionId: string) {
  if (plan === "free" && joinsUsed >= 3) {
    setShowUpgrade(true);
    return;
  }
  setJoiningId(sessionId);
  joinMutation.mutate(sessionId, {
    onSuccess: () => {
      toast.success("Join request sent! The host will review it.");
      // Invalidate profile so joinsUsed refreshes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
    onError: (err: unknown) => {
      const error = err as Error & { status?: number; data?: { error?: string } };
      if (error.status === 403 && error.data?.error === "limit_reached") {
        setShowUpgrade(true);
        return;
      }
      toast.error(error.message || "Failed to join session");
    },
    onSettled: () => setJoiningId(null),
  });
}
```

- [ ] **Step 4: Replace handleLeave**

Find the `handleLeave` function that does `fetch("/api/peer-sessions/join", { method: "DELETE", ... })` and replace with:
```tsx
async function handleLeave(sessionId: string) {
  leaveMutation.mutate(sessionId, {
    onSuccess: () => {
      toast.success("You have left the session.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to leave session");
    },
  });
}
```

- [ ] **Step 5: Replace handleCreate (admin create session)**

Find the create session POST fetch call and replace it with:
```tsx
createMutation.mutate(body, {
  onSuccess: () => {
    toast.success("Session created!");
    setDialogOpen(false);
  },
  onError: (err: unknown) => {
    toast.error(err instanceof Error ? err.message : "Failed to create session");
  },
});
```

where `body` is the same object that was previously passed to `fetch`.

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/app/peer-practice/page.tsx
git commit -m "feat: migrate peer-practice page to React Query"
```

---

## Task 11: Migrate peer-practice/[id]/page.tsx

**Files:**
- Modify: `app/app/peer-practice/[id]/page.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { usePeerSession, useJoinPeerSession, useLeavePeerSession, useRespondToJoin } from "@/lib/queries/peer-sessions";
```

- [ ] **Step 2: Replace fetchSession state and effect**

Remove:
```tsx
const [session, setSession] = useState<PeerSession | null>(null);
const [userId, setUserId] = useState("");
const [loading, setLoading] = useState(true);
const [notFound, setNotFound] = useState(false);
```

And remove the `fetchSession` function and its `useEffect`:
```tsx
async function fetchSession() {
  try {
    const res = await fetch(`/api/peer-sessions/${id}`);
    if (res.status === 404) { setNotFound(true); return; }
    const data = await res.json();
    setSession(data.session);
    setUserId(data.userId ?? "");
  } catch {
    toast.error("Failed to load session");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  fetchSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);
```

Replace with:
```tsx
const { data: sessionData, isLoading: loading, isError, error } = usePeerSession(id);
const session = sessionData?.session ?? null;
const userId = sessionData?.userId ?? "";
const notFound = isError && (error as Error & { status?: number })?.status === 404;
const joinMutation = useJoinPeerSession();
const leaveMutation = useLeavePeerSession();
const respondMutation = useRespondToJoin(id);
```

- [ ] **Step 3: Replace handleJoin**

Replace:
```tsx
async function handleJoin() {
  if (!session) return;
  setJoining(true);
  try {
    const res = await fetch("/api/peer-sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to send request");
    }
    toast.success("Join request sent! The host will review it.");
    fetchSession();
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : "Failed to send request");
  } finally {
    setJoining(false);
  }
}
```

With:
```tsx
function handleJoin() {
  if (!session) return;
  setJoining(true);
  joinMutation.mutate(session.id, {
    onSuccess: () => toast.success("Join request sent! The host will review it."),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to send request"),
    onSettled: () => setJoining(false),
  });
}
```

- [ ] **Step 4: Replace handleRespond**

Replace:
```tsx
async function handleRespond(targetUserId: string, action: "accept" | "reject") {
  if (!session) return;
  setResponding(targetUserId);
  try {
    const res = await fetch("/api/peer-sessions/join/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id, user_id: targetUserId, action }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Failed to ${action}`);
    }
    toast.success(action === "accept" ? "Request accepted!" : "Request declined.");
    fetchSession();
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
  } finally {
    setResponding(null);
  }
}
```

With:
```tsx
function handleRespond(targetUserId: string, action: "accept" | "reject") {
  if (!session) return;
  setResponding(targetUserId);
  respondMutation.mutate({ userId: targetUserId, action }, {
    onSuccess: () => toast.success(action === "accept" ? "Request accepted!" : "Request declined."),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : `Failed to ${action}`),
    onSettled: () => setResponding(null),
  });
}
```

- [ ] **Step 5: Replace handleLeave**

Find the `handleLeave` function that uses `fetch("/api/peer-sessions/join", { method: "DELETE", ... })` and replace with:
```tsx
function handleLeave() {
  if (!session) return;
  leaveMutation.mutate(session.id, {
    onSuccess: () => router.push("/app/peer-practice"),
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to leave"),
  });
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "app/app/peer-practice/[id]/page.tsx"
git commit -m "feat: migrate peer-practice detail page to React Query"
```

---

## Task 12: Migrate settings/page.tsx

**Files:**
- Modify: `app/app/settings/page.tsx`

- [ ] **Step 1: Add imports**

Add after the existing imports:
```tsx
import { useSettingsProfile } from "@/lib/queries/profile";
import { useSubscription } from "@/lib/queries/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";
```

- [ ] **Step 2: Add query hooks inside the component**

At the top of the component function body (after existing `useState` declarations), add:
```tsx
const { data: settingsProfile } = useSettingsProfile();
const { data: subscriptionData, refetch: refetchSubscription } = useSubscription();
const queryClient = useQueryClient();
```

- [ ] **Step 3: Replace the data-loading useEffect**

Remove this entire `useEffect`:
```tsx
useEffect(() => {
  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");
    setUserId(user.id);
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url, resume_url, experience_level, interview_timeline, target_companies, email_notifications, match_alerts, interview_style, interview_duration, practice_partner, interview_language, interview_platform, feedback_preference, wants_tips").eq("id", user.id).single(),
      supabase.from("subscriptions").select("plan, cancel_at_period_end, current_period_end").eq("user_id", user.id).single(),
    ]);
    setPlan((subscription?.plan as "free" | "pro") ?? "free");
    setCancelAtPeriodEnd(subscription?.cancel_at_period_end ?? false);
    setCurrentPeriodEnd(subscription?.current_period_end ?? null);
    if (profile) {
      if (profile.full_name) setDisplayName(profile.full_name);
      if (profile.experience_level) setExperienceLevel(profile.experience_level);
      if (profile.interview_timeline) setTimeline(profile.interview_timeline);
      if (profile.target_companies?.length) setTargetCompanies(profile.target_companies);
      if (profile.email_notifications !== null && profile.email_notifications !== undefined) setEmailNotifs(profile.email_notifications);
      if (profile.match_alerts !== null && profile.match_alerts !== undefined) setMatchAlerts(profile.match_alerts);
      if (profile.interview_style) setInterviewStyle(profile.interview_style);
      if (profile.interview_duration) setInterviewDuration(profile.interview_duration);
      if (profile.practice_partner) setPracticePartner(profile.practice_partner);
      if (profile.interview_language) setInterviewLanguage(profile.interview_language);
      if (profile.interview_platform) setInterviewPlatform(profile.interview_platform);
      if (profile.feedback_preference) setFeedbackPreference(profile.feedback_preference);
      if (profile.wants_tips !== null && profile.wants_tips !== undefined) setWantsTips(profile.wants_tips);
      setAvatarUrl(profile.avatar_url);
      if (profile.resume_url) {
        const parts = profile.resume_url.split("/");
        setResumeName(decodeURIComponent(parts[parts.length - 1]));
      }
      setResumeLoaded(true);
    }
  }
  load();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Replace with two `useEffect`s that sync query data into form state:
```tsx
// Sync profile data into form state when query resolves
useEffect(() => {
  if (!settingsProfile) return;
  if (settingsProfile.full_name) setDisplayName(settingsProfile.full_name);
  if (settingsProfile.experience_level) setExperienceLevel(settingsProfile.experience_level);
  if (settingsProfile.interview_timeline) setTimeline(settingsProfile.interview_timeline);
  if (settingsProfile.target_companies?.length) setTargetCompanies(settingsProfile.target_companies);
  if (settingsProfile.email_notifications !== null && settingsProfile.email_notifications !== undefined)
    setEmailNotifs(settingsProfile.email_notifications);
  if (settingsProfile.match_alerts !== null && settingsProfile.match_alerts !== undefined)
    setMatchAlerts(settingsProfile.match_alerts);
  if (settingsProfile.interview_style) setInterviewStyle(settingsProfile.interview_style);
  if (settingsProfile.interview_duration) setInterviewDuration(settingsProfile.interview_duration);
  if (settingsProfile.practice_partner) setPracticePartner(settingsProfile.practice_partner);
  if (settingsProfile.interview_language) setInterviewLanguage(settingsProfile.interview_language);
  if (settingsProfile.interview_platform) setInterviewPlatform(settingsProfile.interview_platform);
  if (settingsProfile.feedback_preference) setFeedbackPreference(settingsProfile.feedback_preference);
  if (settingsProfile.wants_tips !== null && settingsProfile.wants_tips !== undefined)
    setWantsTips(settingsProfile.wants_tips);
  setAvatarUrl(settingsProfile.avatar_url ?? null);
  if (settingsProfile.resume_url) {
    const parts = settingsProfile.resume_url.split("/");
    setResumeName(decodeURIComponent(parts[parts.length - 1]));
  }
  setResumeLoaded(true);
}, [settingsProfile]); // eslint-disable-line react-hooks/exhaustive-deps

// Sync subscription into plan state
useEffect(() => {
  if (!subscriptionData) return;
  setPlan((subscriptionData.plan as "free" | "pro") ?? "free");
  setCancelAtPeriodEnd(subscriptionData.cancel_at_period_end ?? false);
  setCurrentPeriodEnd(subscriptionData.current_period_end ?? null);
}, [subscriptionData]);
```

Also add a `useEffect` at the bottom of the existing ones to load `email` and `userId` from Supabase auth (this was previously done inside the removed `load()` function). Keep using the Supabase client for auth only:
```tsx
useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      setEmail(user.email ?? "");
      setUserId(user.id);
    }
  });
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Replace loadPlan with refetchSubscription in upgrade polling**

Find the `loadPlan` function:
```tsx
const loadPlan = useCallback(async (): Promise<"free" | "pro"> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "free";
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .single();
  const fetched = (subscription?.plan as "free" | "pro") ?? "free";
  setPlan(fetched);
  setCancelAtPeriodEnd(subscription?.cancel_at_period_end ?? false);
  setCurrentPeriodEnd(subscription?.current_period_end ?? null);
  return fetched;
}, [supabase]);
```

Replace it with:
```tsx
const loadPlan = useCallback(async (): Promise<"free" | "pro"> => {
  const result = await refetchSubscription();
  return (result.data?.plan as "free" | "pro") ?? "free";
}, [refetchSubscription]);
```

The `useEffect` that uses `loadPlan` for upgrade polling can remain unchanged — it still calls `loadPlan()` and checks the returned plan.

- [ ] **Step 5: Verify the build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Run all tests one final time**

```bash
npx jest lib/queries/__tests__/ --no-coverage 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/app/settings/page.tsx
git commit -m "feat: migrate settings page to React Query hooks"
```
