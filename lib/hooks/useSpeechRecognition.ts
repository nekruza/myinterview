"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useSpeechRecognition(lang: string = "en-US") {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Check support without useEffect (avoids Strict Mode issues)
  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Lazily create (or return existing) SpeechRecognition instance
  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (!SR) return null;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langRef.current;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setFinalTranscript((prev) => prev + final);
        setTranscript("");
      } else {
        setTranscript(interim);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we should still be listening (Chrome stops after silence)
      if (shouldListenRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started or invalid state — ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
        shouldListenRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // Normal - no action needed, onend will auto-restart
      } else if (event.error === "aborted") {
        // Intentional stop — ignore
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const startListening = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;

    // Apply the latest requested language before starting, in case it
    // changed since the instance was created (e.g. the learner switched
    // target language between sessions).
    recognition.lang = langRef.current;

    setError(null);
    setTranscript("");
    setFinalTranscript("");
    shouldListenRef.current = true;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      // Already started — ignore
    }
  }, [ensureRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setFinalTranscript("");
  }, []);

  // Cleanup on unmount only — abort and release instance
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    transcript,
    finalTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
