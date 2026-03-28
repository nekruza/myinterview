"use client";

import { useState, useRef, useCallback } from "react";
import { fal } from "@fal-ai/client";

fal.config({ proxyUrl: "/api/fal/proxy" });

export type LipSyncState = "idle" | "loading" | "uploading" | "processing" | "ready";

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
      const mimeType = ttsRes.headers.get("Content-Type") ?? "audio/mpeg";
      const audioFile = new File([audioBlob], "speech.mp3", { type: mimeType });
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

      const data = result.data as { video?: { url?: string } } | undefined;
      const videoUrl = data?.video?.url;
      if (!videoUrl) throw new Error("Invalid MuseTalk response: missing video.url");
      setVideoUrl(videoUrl);
      setState("ready");
    } catch (err) {
      setState("idle");
      throw new Error("lip-sync-failed", { cause: err });
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
