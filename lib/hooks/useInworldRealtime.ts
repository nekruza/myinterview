"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@/lib/practice-data";

export interface RealtimeConfig {
  instructions: string;
  voice: string;
  model: string;
  interviewType: "technical" | "behavioural";
}

export interface UseInworldRealtimeReturn {
  connect: (config: RealtimeConfig) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  agentState: "idle" | "speaking" | "listening" | "processing";
  messages: Message[];
  agentAudioStream: MediaStream | null;
  sendTextMessage: (text: string) => void;
  cancelResponse: () => void;
  muteMic: (muted: boolean) => void;
}

export function useInworldRealtime(): UseInworldRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [agentState, setAgentState] = useState<"idle" | "speaking" | "listening" | "processing">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentAudioStream, setAgentAudioStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const currentAssistantContentRef = useRef<string>("");

  const sendEvent = useCallback((event: object) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(event));
    }
  }, []);

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(event.data as string);
    } catch {
      return;
    }

    const type = parsed.type as string;

    if (type === "response.created") {
      setAgentState("processing");
      currentAssistantContentRef.current = "";
    } else if (type === "response.output_audio.started") {
      setAgentState("speaking");
    } else if (type === "input_audio_buffer.speech_started") {
      setAgentState("listening");
    } else if (type === "response.done") {
      setAgentState("idle");
      currentAssistantContentRef.current = "";
    } else if (type === "response.output_text.delta") {
      const delta = (parsed.delta as string) ?? "";
      currentAssistantContentRef.current += delta;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { role: "assistant", content: currentAssistantContentRef.current },
          ];
        }
        return [...prev, { role: "assistant", content: currentAssistantContentRef.current }];
      });
    } else if (type === "conversation.item.input_audio_transcription.completed") {
      const transcript = (parsed.transcript as string)?.trim();
      if (transcript) {
        setMessages((prev) => [...prev, { role: "user", content: transcript }]);
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      }
    }
  }, []);

  const connect = useCallback(async (config: RealtimeConfig) => {
    if (pcRef.current) return;

    // Fetch ICE servers from our server (no API key returned)
    const configRes = await fetch("/api/realtime/config");
    if (!configRes.ok) throw new Error("Failed to fetch realtime config");
    const { iceServers } = await configRes.json() as { iceServers: RTCIceServer[] };

    // Get microphone and establish connection
    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // Create peer connection
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      // Add mic track
      const audioTrack = micStream.getAudioTracks()[0];
      pc.addTrack(audioTrack, micStream);

      // Capture remote audio track for playback
      pc.ontrack = (event: RTCTrackEvent) => {
        if (event.track.kind === "audio") {
          const remoteStream = new MediaStream([event.track]);
          setAgentAudioStream(remoteStream);
          const audio = document.getElementById("inworld-agent-audio") as HTMLAudioElement | null;
          if (audio) {
            audio.srcObject = remoteStream;
            audio.play().catch(() => {});
          }
        }
      };

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        sendEvent({
          type: "session.update",
          session: {
            type: "realtime",
            model: config.model,
            instructions: config.instructions,
            output_modalities: ["audio", "text"],
            voice: {
              model: "inworld-tts-1.5-mini",
              name: config.voice,
            },
            input_audio_transcription: { model: "inworld-stt-1" },
            turn_detection: {
              type: "semantic_vad",
              create_response: true,
              interrupt_response: true,
            },
          },
        });

        sendEvent({ type: "response.create" });

        setIsConnected(true);
        setAgentState("processing");
      };

      dc.onmessage = handleDataChannelMessage;

      // Exchange SDP via our server proxy (API key stays server-side)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("/api/realtime/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp }),
      });

      if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`);

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      micStream?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      throw err;
    }
  }, [sendEvent, handleDataChannelMessage]);

  const disconnect = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    dcRef.current = null;
    pcRef.current = null;
    micStreamRef.current = null;
    currentAssistantContentRef.current = "";
    setIsConnected(false);
    setAgentState("idle");
    setAgentAudioStream(null);
    setMessages([]);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    sendEvent({ type: "response.create" });
  }, [sendEvent]);

  const cancelResponse = useCallback(() => {
    sendEvent({ type: "response.cancel" });
  }, [sendEvent]);

  const muteMic = useCallback((muted: boolean) => {
    const stream = micStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, []);

  useEffect(() => {
    return () => {
      dcRef.current?.close();
      pcRef.current?.close();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    agentState,
    messages,
    agentAudioStream,
    sendTextMessage,
    cancelResponse,
    muteMic,
  };
}
