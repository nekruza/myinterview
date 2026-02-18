# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required vars:
- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **AI:** `CHUTES_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `NEXT_PUBLIC_LLM_PROVIDER` (`chutes` or `gemini`)
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Admin:** `ADMIN_PASSWORD`

## About This App

**MyInterview** helps developers overcome interview anxiety through deliberate practice. The core premise is that anxiety comes from unfamiliarity — repeated exposure to realistic interview conditions builds confidence. The app supports three interview modes:

- **Technical oral interview** — voice-based technical questions (algorithms, system design, role-specific) with a live AI interviewer (Maria)
- **Behavioral oral interview** — voice-based STAR-format questions covering Leadership, Ownership, Conflict, Failure, and Collaboration

Sessions can be with an AI interviewer or with real peers via the peer-practice feature.

## Architecture

**MyInterview** is a Next.js 16 (App Router) SaaS app for AI-powered and peer-to-peer mock interview practice. It targets software engineers preparing for technical and behavioral interviews.

### Route Groups

- `app/(auth)/` — Public auth pages (login, signup, forgot-password)
- `app/app/` — Protected app pages (dashboard, practice, peer-practice, progress, settings)
- `app/admin/` — Admin dashboard with password auth (separate from Supabase auth)
- `app/api/` — API routes
- `app/blog/`, `app/landing/`, `app/privacy/`, `app/terms/` — Marketing/static pages

### Key API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/ai/voice` | Core AI interview endpoint — streams SSE responses from Chutes/Gemini LLM; accepts `question`, `category`, `level`, `messages`, `interviewType`, `jobContext`, `resumeText`, `role`, `sessionId` |
| `POST /api/ai/chat` | Text-based interview with R-STAR feedback; saves to `interview_messages` table; requires auth |
| `POST /api/tts` | Text-to-speech conversion |
| `/api/peer-sessions/` | CRUD + join/respond for peer practice sessions |
| `/api/profile/` | Get/update user profile |
| `/api/sessions/` | Create interview session records |
| `/api/admin/` | Waitlist management, password-based admin login |

### LLM Provider Abstraction

`lib/llm.ts` abstracts between two providers (controlled by `NEXT_PUBLIC_LLM_PROVIDER`):
- **Chutes AI** (default) — Qwen2.5-72B-Instruct via HTTP
- **Google Gemini** — 2.0 Flash via HTTP

The voice route (`app/api/ai/voice/route.ts`) builds system prompts dynamically from interview type (technical/behavioral), level (junior/mid/senior/staff), role (14+ tech roles in `lib/practice-data.ts`), resume text, and job context.

### Voice Interview Flow

The core UX lives in `components/practice/VoiceCallView.tsx`:
1. User selects type, level, role, job context, resume on `app/app/practice/page.tsx`
2. `VoiceCallView` requests mic/camera, starts `useSpeechRecognition` hook (Web Speech API)
3. User speech → transcript → `POST /api/ai/voice` → SSE stream back
4. `useSpeechSynthesis` reads AI response aloud; `useAudioVisualizer` animates waveform
5. Session saved to Supabase (`interview_sessions`, `interview_messages` tables)

Custom hooks in `lib/hooks/`: `useSpeechRecognition`, `useSpeechSynthesis`, `useAudioVisualizer`, `useTimer`.

### Auth & Middleware

Supabase SSR handles auth. `middleware.ts` protects `/app/*` and `/admin/*` routes. Supabase clients:
- Browser: `lib/supabase/client.ts`
- Server: `lib/supabase/server.ts`

### UI Stack

Tailwind CSS 4 + shadcn/ui (config in `components.json`) + Lucide React icons + Sonner toasts. Path alias `@/*` maps to project root.

### Database (Supabase)

Key tables: `profiles`, `interview_sessions`, `interview_messages`, `peer_sessions`, `notifications`, `waitlist_applications`. Storage buckets: `resumes`, `avatars`.

### Practice Data

`lib/practice-data.ts` contains `TECH_ROLES` (14 roles), interview categories, behavioral categories (Leadership, Ownership, Conflict, Failure, Collaboration), and level definitions. Edit this file to add/modify roles or question categories.
