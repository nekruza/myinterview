"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isCancelledRef = useRef(false);
  const resolveRef = useRef<(() => void) | null>(null);
  // Ref to current Kokoro Audio element so cancel() can stop it
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Refs for safety timeout and Chrome keepalive interval in speakFallback
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = [
        "Google US English",
        "Daniel",
        "Alex",
        "Microsoft David",
        "Google UK English Male",
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

  const speakChunk = useCallback((text: string, onEnd: () => void, lang?: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const languageVoice = lang
      ? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)))
      : undefined;
    if (languageVoice) {
      utterance.voice = languageVoice;
    } else if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    if (lang) utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakFallback = useCallback(
    (text: string, lang?: string): Promise<void> => {
      window.speechSynthesis.cancel();
      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
        let resolved = false;

        const done = () => {
          if (resolved) return;
          resolved = true;
          if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
          }
          if (resumeIntervalRef.current) {
            clearInterval(resumeIntervalRef.current);
            resumeIntervalRef.current = null;
          }
          setIsSpeaking(false);
          resolveRef.current = null;
          resolve();
        };

        // Chrome pauses speechSynthesis after ~15s when tab is in background.
        // Keepalive: pause+resume every 10s to prevent it from stalling.
        resumeIntervalRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking && !isCancelledRef.current) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);

        // Safety timeout: if onend never fires (Chrome bug), resolve anyway.
        const estimatedMs = Math.max(text.length * 80, 6000);
        safetyTimeoutRef.current = setTimeout(done, estimatedMs);

        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks = sentences.map((s) => s.trim()).filter(Boolean);
        let index = 0;
        const speakNext = () => {
          if (isCancelledRef.current || index >= chunks.length) {
            done();
            return;
          }
          speakChunk(
            chunks[index],
            () => {
              index++;
              speakNext();
            },
            lang
          );
        };
        speakNext();
      });
    },
    [speakChunk]
  );

  // ── Kokoro primary + Web Speech fallback ────────────────────────────────────

  const speakAsync = useCallback(
    async (text: string, voiceId?: string, lang?: string): Promise<void> => {
      if (typeof window === "undefined") return;

      isCancelledRef.current = false;
      setIsSpeaking(true);

      // 1. Try Kokoro via /api/tts
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId, language: lang }),
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
        await speakFallback(text, lang);
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

    // Clear fallback safety timeout and keepalive interval
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }

    setIsSpeaking(false);

    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  return { speakAsync, cancel, isSpeaking };
}
