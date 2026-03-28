# Lip-Sync AI Avatar — Design Spec

**Date:** 2026-03-28
**Status:** Approved

## Overview

Replace the static photo avatar of "Maria Rodriguez" in the interview practice view with a lip-synced talking head video. When the AI generates a response, the audio is sent to fal.ai's MuseTalk model, which animates the mouth of a source avatar video in sync with the speech. The result video is played in place of the static image.

## One-Time Setup

Create `public/avatar.mp4` from `public/avatar.png` using ffmpeg (run once locally):

```bash
ffmpeg -loop 1 -i public/avatar.png -t 4 -vf "fps=25,scale=512:512" -c:v libx264 -pix_fmt yuv420p public/avatar.mp4
```

This produces a 4-second silent 512×512 MP4 — the source video format MuseTalk expects. Commit the file to the repo.

## Architecture

### New Files

**`app/api/fal/[...path]/route.ts`**
fal.ai proxy route. Forwards browser requests to the fal.ai API with the server-side `FAL_KEY` env var. Keeps the API key off the client. Required by `@fal-ai/client` when using `proxyUrl`.

**`lib/hooks/useLipSync.ts`**
Orchestrates the full pipeline. Exposes:
- `generate(text: string): Promise<void>` — triggers TTS → upload → MuseTalk
- `videoUrl: string | null` — the fal.ai output video URL when ready
- `isProcessing: boolean` — true from start of generate() until video is ready or error
- `reset(): void` — clears videoUrl, returns to idle

### Modified Files

**`components/practice/VideoArea.tsx`**
Accepts new prop `lipSyncVideoUrl: string | null`. When set, renders `<video autoPlay src={lipSyncVideoUrl}>` in place of the static avatar image. `onEnded` callback signals completion.

**`components/practice/VoiceCallView.tsx`**
- Instantiates `useLipSync`
- On each new AI message: calls `lipSync.generate(aiText)` instead of `tts.speakAsync(aiText)`
- Passes `lipSync.videoUrl` and `lipSync.isProcessing` down to `VideoArea`
- `isAISpeaking` remains `true` during the entire processing + playback window

## Data Flow

```
AI text response
  → POST /api/tts → audio blob (Inworld TTS)
  → fal.storage.upload(blob) → audio_url (public CDN URL)
  → fal.subscribe("fal-ai/musetalk", { source_video_url, audio_url })
  → wait ~10–30s
  → result.data.video.url → set as lipSyncVideoUrl
  → <video> plays (audio embedded in MuseTalk output)
```

`source_video_url` is the absolute URL to `public/avatar.mp4` (e.g. `https://domain.com/avatar.mp4`). In development this needs to be a publicly reachable URL — use `NEXT_PUBLIC_BASE_URL` env var.

## State Machine

`useLipSync` internal states:

```
idle → loading → uploading → processing → ready → idle
```

- `idle`: no activity
- `loading`: fetching TTS audio from /api/tts
- `uploading`: uploading audio blob to fal.ai storage
- `processing`: waiting for MuseTalk to return
- `ready`: videoUrl is set, video is playing
- After `video.onEnded` fires → reset to `idle`

`isProcessing` is `true` for `loading | uploading | processing`.

## Error Handling

If any step fails (TTS, fal storage upload, MuseTalk error/timeout):
- Fall back to `tts.speakAsync(text)` — plays Inworld audio with static avatar (current behavior)
- No error UI shown to user; experience degrades gracefully to what exists today

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `FAL_KEY` | fal.ai API key — server-side only |
| `NEXT_PUBLIC_BASE_URL` | Base URL for avatar.mp4 source video (e.g. `https://myinterview.app`) |

## Dependencies

Add `@fal-ai/client` to package.json.

## What Is Not Changing

- The `/api/tts` route (Inworld primary, Kokoro fallback) is unchanged
- `useSpeechSynthesis` hook is kept as error fallback
- All other practice view components (TranscriptPanel, ControlBar, etc.) are unchanged
- The user-facing webcam / user video tile is unchanged
