# React Query Integration Design

**Date:** 2026-03-30
**Scope:** Add TanStack React Query for client-side data caching across all client components

---

## Overview

The app uses Next.js App Router with a mix of server components (dashboard, progress — fetch Supabase directly server-side) and client components (AppSidebar, peer-practice, settings — use raw `fetch()` with `useEffect`). This integration adds React Query to the client components only, providing caching, deduplication, and automatic invalidation without touching server components.

---

## Architecture

**Approach:** Minimal client setup — `QueryClientProvider` wraps client subtree only. No hydration/SSR prefetching. Server components remain unchanged.

**New files:**
```
components/QueryProvider.tsx        # "use client" QueryClientProvider wrapper
lib/queries/keys.ts                 # Central QUERY_KEYS constants
lib/queries/profile.ts              # useProfile, useUpdateProfile
lib/queries/notifications.ts        # useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead
lib/queries/peer-sessions.ts        # usePeerSessions, usePeerSession(id), useCreatePeerSession, useJoinPeerSession, useRespondToJoin
lib/queries/subscription.ts         # useSubscription
```

**Modified files:**
```
app/app/layout.tsx                  # Wrap children with QueryProvider
app/app/AppSidebar.tsx              # useProfile + useNotifications
app/app/peer-practice/page.tsx      # usePeerSessions + useProfile + mutations
app/app/peer-practice/[id]/page.tsx # usePeerSession(id) + mutations
app/app/settings/page.tsx           # useSubscription + Stripe mutations
```

---

## QueryClient Configuration

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      retry: (count, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return count < 2;
      },
    },
  },
})
```

---

## Query Keys

```ts
// lib/queries/keys.ts
export const QUERY_KEYS = {
  profile: ['profile'] as const,
  notifications: ['notifications'] as const,
  peerSessions: ['peer-sessions'] as const,
  peerSession: (id: string) => ['peer-sessions', id] as const,
  subscription: ['subscription'] as const,
} as const;
```

---

## Hook Definitions

### `useProfile` / `useUpdateProfile`
- `useProfile`: GET `/api/profile` — stale time 5min
- `useUpdateProfile`: POST `/api/profile` — on success, invalidates `profile`

### `useNotifications` / mutations
- `useNotifications`: GET `/api/notifications` — stale time 1min (more real-time)
- `useMarkNotificationRead(id)`: POST `/api/notifications` with `{ id, read: true }` — on success, invalidates `notifications`
- `useMarkAllNotificationsRead`: POST `/api/notifications` with `{ all: true }` — on success, invalidates `notifications`

### `usePeerSessions` / `usePeerSession` / mutations
- `usePeerSessions`: GET `/api/peer-sessions` — stale time 30s (live-ish data)
- `usePeerSession(id)`: GET `/api/peer-sessions/${id}` — stale time 10s
- `useCreatePeerSession`: POST `/api/peer-sessions` — on success, invalidates `peerSessions`
- `useJoinPeerSession`: POST `/api/peer-sessions/join` — on success, invalidates `peerSessions` + `peerSession(id)`
- `useRespondToJoin`: POST `/api/peer-sessions/join/respond` — on success, invalidates `peerSession(id)`

### `useSubscription`
- `useSubscription`: queries Supabase client directly for `subscriptions` table — stale time 5min
- Stripe checkout/portal remain as plain `fetch()` calls (they redirect, not query/mutate cached state)

---

## Component Migration Summary

| Component | Before | After |
|---|---|---|
| `AppSidebar.tsx` | `useEffect` + raw `fetch` for notifications + profile | `useNotifications()` + `useProfile()` |
| `peer-practice/page.tsx` | `Promise.all` fetch in `useEffect` | `usePeerSessions()` + `useProfile()` + mutations |
| `peer-practice/[id]/page.tsx` | `fetch` in `useEffect` | `usePeerSession(id)` + mutations |
| `settings/page.tsx` | `useEffect` + Supabase client for subscription | `useSubscription()` + Stripe stays as-is |

---

## Cache Invalidation Strategy

- Profile mutations → invalidate `profile`
- Notification mutations → invalidate `notifications`
- Peer session create/join/respond → invalidate `peerSessions` and/or `peerSession(id)`
- Subscription is read-only from the client (Stripe webhook updates it server-side)

---

## Out of Scope

- Server components (dashboard, progress) — already fetch efficiently server-side
- React Query DevTools — not added (can be added manually for debugging)
- Optimistic updates — not in scope for this integration
- Stripe checkout/portal mutations — these redirect to external URLs, not suitable for mutation caching
