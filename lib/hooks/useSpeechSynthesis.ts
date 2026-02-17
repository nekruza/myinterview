"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isCancelledRef = useRef(false);
  const resolveRef = useRef<(() => void) | null>(null);
  // Ref to current Kokoro Audio element so cancel() can stop it
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = [
        "Google UK English Female",
        "Google US English",
        "Samantha",
        "Karen",
        "Microsoft Zira",
      ];
      for (const name of preferred) {
        const found = voices.find((v) => v.name.includes(name));
        if (found) {
          voiceRef.current = found;
          return;
        }
      }
      const english = voices.find((v) => v.lang.startsWith("en"));
      if (english) voiceRef.current = english;
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── Web SpeechSynthesis fallback (chunked to avoid Chrome 15s bug) ──────────

  const speakChunk = useCallback((text: string, onEnd: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakFallback = useCallback(
    (text: string): Promise<void> => {
      window.speechSynthesis.cancel();
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks = sentences.map((s) => s.trim()).filter(Boolean);
        let index = 0;
        const speakNext = () => {
          if (isCancelledRef.current || index >= chunks.length) {
            setIsSpeaking(false);
            resolveRef.current = null;
            resolve();
            return;
          }
          speakChunk(chunks[index], () => {
            index++;
            speakNext();
          });
        };
        speakNext();
      });
    },
    [speakChunk]
  );

  // ── Kokoro primary + Web Speech fallback ────────────────────────────────────

  const speakAsync = useCallback(
    async (text: string): Promise<void> => {
      if (typeof window === "undefined") return;

      isCancelledRef.current = false;
      setIsSpeaking(true);

      // 1. Try Kokoro via /api/tts
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          await new Promise<void>((resolve, reject) => {
            resolveRef.current = resolve;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              audioRef.current = null;
              resolveRef.current = null;
              setIsSpeaking(false);
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              audioRef.current = null;
              reject(new Error("Audio playback error"));
            };
            if (!isCancelledRef.current) {
              audio.play().catch(reject);
            } else {
              URL.revokeObjectURL(url);
              resolve();
            }
          });

          return;
        }
      } catch {
        // Kokoro failed — fall through to Web Speech
      }

      // 2. Fallback: Web SpeechSynthesis
      if (!isCancelledRef.current) {
        await speakFallback(text);
      } else {
        setIsSpeaking(false);
      }
    },
    [speakFallback]
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;

    // Stop Kokoro audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop Web Speech if active
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);

    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  return { speakAsync, cancel, isSpeaking };
}
