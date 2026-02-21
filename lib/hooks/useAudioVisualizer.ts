"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudioVisualizer() {
  const [analyserData, setAnalyserData] = useState<Uint8Array>(
    new Uint8Array(32)
  );
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const startAnalyser = useCallback((stream: MediaStream) => {
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      contextRef.current = context;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        setAnalyserData(new Uint8Array(dataArray));
        rafRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // AudioContext not supported
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourceRef.current?.disconnect();
    if (contextRef.current && contextRef.current.state !== "closed") {
      contextRef.current.close();
    }
    contextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setAnalyserData(new Uint8Array(32));
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      if (contextRef.current && contextRef.current.state !== "closed") {
        contextRef.current.close();
      }
      contextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, []);

  return { analyserData, startAnalyser, stopAnalyser };
}
