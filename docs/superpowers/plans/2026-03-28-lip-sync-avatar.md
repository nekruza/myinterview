# Lip-Sync AI Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the AI interviewer speaks, play a MuseTalk-generated lip-synced video of `avatar.mp4` in the interviewer card instead of the static photo.

**Architecture:** `useLipSync` orchestrates TTS → fal.ai storage upload → MuseTalk → returns video URL. `VoiceCallView` calls it instead of `tts.speakAsync`. `VideoArea` renders `<video>` when a URL is available, otherwise falls back to the static photo. A Next.js catch-all proxy route keeps `FAL_KEY` server-side.

**Tech Stack:** `@fal-ai/client`, fal-ai/musetalk, Next.js App Router, React 19

---

## Pre-requisite: Create avatar.mp4

Before running any code, create `public/avatar.mp4` from `public/avatar.png`. Run this once in your terminal (requires ffmpeg):

```bash
ffmpeg -loop 1 -i public/avatar.png -t 4 -vf "fps=25,scale=512:512" -c:v libx264 -pix_fmt yuv420p public/avatar.mp4
```

Then commit it:
```bash
git add public/avatar.mp4
git commit -m "chore: add avatar source video for MuseTalk"
```

---

## Task 1: Install @fal-ai/client

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @fal-ai/client
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@fal-ai/client'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @fal-ai/client"
```

---

## Task 2: Add fal.ai proxy route

**Files:**
- Create: `app/api/fal/[...path]/route.ts`

The fal.ai client needs a server-side proxy so `FAL_KEY` never reaches the browser. This catch-all route forwards all fal requests (GET/POST/PUT) using the `@fal-ai/client/nextjs` helper.

- [ ] **Step 1: Create the proxy route**

Create `app/api/fal/[...path]/route.ts` with this exact content:

```typescript
import { route } from "@fal-ai/client/nextjs";

export const runtime = "nodejs";

const handler = route();
export const { GET, POST, PUT } = handler;
```

- [ ] **Step 2: Add FAL_KEY to your .env.local**

Open `.env.local` and add:

```
FAL_KEY=your_fal_ai_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`NEXT_PUBLIC_BASE_URL` must be a publicly reachable URL in production (e.g. `https://myinterview.app`). In local dev, MuseTalk cannot reach `localhost` — for local testing use a tunnel like `ngrok http 3000` and set `NEXT_PUBLIC_BASE_URL` to the ngrok URL.

- [ ] **Step 3: Start dev server and verify route exists**

```bash
npm run dev
```

In another terminal:

```bash
curl -X POST http://localhost:3000/api/fal/proxy -H "Content-Type: application/json" -d '{}'
```

Expected: a JSON error response from fal.ai (not a 404). Any non-404 response confirms the route is wired up.

- [ ] **Step 4: Commit**

```bash
git add app/api/fal/
git commit -m "feat: add fal.ai proxy route"
```

---

## Task 3: Create useLipSync hook

**Files:**
- Create: `lib/hooks/useLipSync.ts`

This hook owns the full pipeline: TTS fetch → fal storage upload → MuseTalk subscribe → video URL. It throws `"lip-sync-failed"` on any error so the caller can fall back to regular TTS.

- [ ] **Step 1: Create the hook**

Create `lib/hooks/useLipSync.ts`:

```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import { fal } from "@fal-ai/client";

fal.config({ proxyUrl: "/api/fal/proxy" });

type LipSyncState = "idle" | "loading" | "uploading" | "processing" | "ready";

export function useLipSync() {
  const [state, setState] = useState<LipSyncState>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const generate = useCallback(async (text: string): Promise<void> => {
    cancelledRef.current = false;
    setState("loading");

    try {
      // 1. Fetch TTS audio
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!ttsRes.ok) throw new Error("TTS failed");
      if (cancelledRef.current) return;
      const audioBlob = await ttsRes.blob();

      // 2. Upload audio to fal.ai storage (returns a public CDN URL)
      setState("uploading");
      const audioFile = new File([audioBlob], "speech.mp3", { type: "audio/mpeg" });
      const audioUrl = await fal.storage.upload(audioFile);
      if (cancelledRef.current) return;

      // 3. Call MuseTalk — waits until the lip-sync video is ready (~10–30s)
      setState("processing");
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
      const result = await fal.subscribe("fal-ai/musetalk", {
        input: {
          source_video_url: `${baseUrl}/avatar.mp4`,
          audio_url: audioUrl,
        },
      });
      if (cancelledRef.current) return;

      const video = (result.data as { video: { url: string } }).video;
      setVideoUrl(video.url);
      setState("ready");
    } catch {
      setState("idle");
      throw new Error("lip-sync-failed");
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setVideoUrl(null);
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    setVideoUrl(null);
    setState("idle");
  }, []);

  return {
    generate,
    cancel,
    reset,
    videoUrl,
    isProcessing:
      state === "loading" || state === "uploading" || state === "processing",
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `useLipSync.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useLipSync.ts
git commit -m "feat: add useLipSync hook (TTS → fal storage → MuseTalk)"
```

---

## Task 4: Update VideoArea to render lip-sync video

**Files:**
- Modify: `components/practice/VideoArea.tsx`

Add a `lipSyncVideoUrl` prop. When it is set, swap the static `<Image>` in the interviewer card for a `<video>` element. When the video ends, call `onLipSyncEnded`.

- [ ] **Step 1: Update the props interface and imports**

In `components/practice/VideoArea.tsx`, replace the existing interface and import block:

```typescript
"use client";

import { FC, useRef, useEffect } from "react";
import Image from "next/image";
import { AudioWaveform } from "./AudioWaveform";
import { Mic } from "lucide-react";

const INTERVIEWER = {
  name: "Maria Rodriguez",
  title: "Head of Digital Transformation",
  photo: "https://randomuser.me/api/portraits/women/43.jpg",
};

interface VideoAreaProps {
  webcamStream: MediaStream | null;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  analyserData: Uint8Array;
  userName?: string;
  avatarUrl?: string | null;
  lipSyncVideoUrl?: string | null;
  onLipSyncEnded?: () => void;
}
```

- [ ] **Step 2: Update the component signature**

Replace the `export const VideoArea: FC<VideoAreaProps> = ({` destructuring to include the new props:

```typescript
export const VideoArea: FC<VideoAreaProps> = ({
  webcamStream,
  isAISpeaking,
  isUserSpeaking,
  analyserData,
  userName = "You",
  avatarUrl,
  lipSyncVideoUrl,
  onLipSyncEnded,
}) => {
```

- [ ] **Step 3: Replace the interviewer photo block with video-aware rendering**

Find the `{/* Human photo avatar */}` block (lines 132–149 in the original file) and replace it entirely:

```typescript
          {/* Interviewer avatar — static photo or lip-sync video */}
          <div className="relative">
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-shadow duration-500"
              style={{
                boxShadow: isAISpeaking
                  ? "0 0 20px rgba(45, 236, 41, 0.35), 0 0 4px rgba(45, 236, 41, 0.5)"
                  : "none",
              }}
            >
              {lipSyncVideoUrl ? (
                <video
                  key={lipSyncVideoUrl}
                  src={lipSyncVideoUrl}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onEnded={onLipSyncEnded}
                />
              ) : (
                <Image
                  src={INTERVIEWER.photo}
                  alt={INTERVIEWER.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              )}
            </div>
            {/* Online indicator */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black/60"
              style={{
                background: isAISpeaking ? "#2dec29" : "#6b7280",
              }}
            />
          </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/practice/VideoArea.tsx
git commit -m "feat: VideoArea renders lip-sync video when lipSyncVideoUrl is set"
```

---

## Task 5: Integrate useLipSync into VoiceCallView

**Files:**
- Modify: `components/practice/VoiceCallView.tsx`

Replace the `speakAndWait` call with a `useLipSync`-first approach. On failure, fall back to `tts.speakAsync`. Also pass `lipSync.videoUrl` and `onLipSyncEnded` to `VideoArea`, and cancel lip sync on pause/stop.

- [ ] **Step 1: Import useLipSync**

At the top of `components/practice/VoiceCallView.tsx`, add to the existing hook imports:

```typescript
import { useLipSync } from "@/lib/hooks/useLipSync";
```

- [ ] **Step 2: Instantiate the hook**

After the existing hook instantiations (`timer`, `speech`, `tts`, `visualizer`), add:

```typescript
  const lipSync = useLipSync();
```

- [ ] **Step 3: Replace speakAndWait**

Find the `speakAndWait` function (around line 270) and replace it entirely:

```typescript
  const speakAndWait = useCallback(
    async (text: string): Promise<void> => {
      speech.stopListening();
      try {
        await lipSync.generate(text);
        // useLipSync sets videoUrl; VideoArea plays it and calls onLipSyncEnded.
        // We wait here until the video finishes — resolved via a one-shot event.
        await new Promise<void>((resolve) => {
          lipSyncResolveRef.current = resolve;
        });
      } catch {
        // MuseTalk failed — fall back to Inworld/browser TTS with static avatar
        lipSync.reset();
        await tts.speakAsync(text);
      }
    },
    [lipSync, tts, speech]
  );
```

- [ ] **Step 4: Add lipSyncResolveRef**

After the existing refs (around line 75), add:

```typescript
  const lipSyncResolveRef = useRef<(() => void) | null>(null);
```

- [ ] **Step 5: Add onLipSyncEnded handler**

After `speakAndWait`, add:

```typescript
  const handleLipSyncEnded = useCallback(() => {
    lipSync.reset();
    if (lipSyncResolveRef.current) {
      lipSyncResolveRef.current();
      lipSyncResolveRef.current = null;
    }
  }, [lipSync]);
```

- [ ] **Step 6: Cancel lip sync on pause and stop**

Find `handlePause` (around line 395) and add `lipSync.cancel()` alongside `tts.cancel()`:

```typescript
  const handlePause = useCallback(() => {
    if (convState === "paused") {
      timer.start();
      startListeningToUser();
    } else {
      setConvState("paused");
      timer.pause();
      speech.stopListening();
      tts.cancel();
      lipSync.cancel();
      lipSyncResolveRef.current?.();
      lipSyncResolveRef.current = null;
    }
  }, [convState, timer, speech, tts, lipSync, startListeningToUser]);
```

Find `handleStop` (around line 408) and add the same two lines:

```typescript
  const handleStop = useCallback(() => {
    setConvState("ending");
    timer.pause();
    speech.stopListening();
    tts.cancel();
    lipSync.cancel();
    lipSyncResolveRef.current?.();
    lipSyncResolveRef.current = null;
    setShowEndModal(true);
  }, [timer, speech, tts, lipSync]);
```

Also add `lipSync.cancel()` to the cleanup effect (around line 441, alongside `tts.cancel()`):

```typescript
      tts.cancel();
      lipSync.cancel();
      lipSyncResolveRef.current?.();
      lipSyncResolveRef.current = null;
```

- [ ] **Step 7: Pass new props to VideoArea**

Find the `<VideoArea` usage (around line 590) and add the two new props:

```typescript
          <VideoArea
            webcamStream={webcamStream}
            isAISpeaking={convState === "ai_speaking"}
            isUserSpeaking={convState === "listening" && speech.isListening}
            analyserData={visualizer.analyserData}
            lipSyncVideoUrl={lipSync.videoUrl}
            onLipSyncEnded={handleLipSyncEnded}
          />
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add components/practice/VoiceCallView.tsx
git commit -m "feat: integrate useLipSync into VoiceCallView with TTS fallback"
```

---

## Task 6: Manual end-to-end verification

No automated test framework is set up in this project. Verify the feature manually.

- [ ] **Step 1: Start the dev server with a tunnel (required for MuseTalk to fetch avatar.mp4)**

In one terminal:
```bash
npm run dev
```

In another terminal (install ngrok if needed: `brew install ngrok`):
```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL (e.g. `https://abc123.ngrok.io`) and update `.env.local`:
```
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

Restart the dev server.

- [ ] **Step 2: Test the happy path**

1. Open the app and start a practice session
2. When Maria's first question arrives, the interviewer card should show the static photo for ~10–30s (MuseTalk processing)
3. After processing, the photo is replaced by a video playing the lip-synced response
4. When the video ends, the app transitions to "listening" state

- [ ] **Step 3: Test the fallback**

1. Temporarily set `FAL_KEY=invalid` in `.env.local` and restart the server
2. Start a session — Maria should still speak using Inworld TTS with the static photo (fallback works)
3. Restore the correct `FAL_KEY`

- [ ] **Step 4: Test pause/stop during processing**

1. Start a session and immediately click Pause while the MuseTalk request is in-flight
2. The session should pause without hanging — the lip-sync promise should resolve and not block

- [ ] **Step 5: Commit env example (optional)**

If your repo has a `.env.example`, add:
```bash
# In .env.example
FAL_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

```bash
git add .env.example
git commit -m "chore: document FAL_KEY and NEXT_PUBLIC_BASE_URL env vars"
```
