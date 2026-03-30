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
  // No streaming text deltas from Inworld — full transcript arrives via response.output_item.done

  const sendEvent = useCallback((event: object) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(event));
    }
  }, []);

  const greetingDoneRef = useRef(false);

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(event.data as string);
    } catch {
      return;
    }

    const type = parsed.type as string;
    console.log("[inworld event]", type, parsed);

    if (type === "session.updated") {
      if (!greetingDoneRef.current) {
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "[BEGIN]" }],
          },
        });
        sendEvent({ type: "response.create" });
      }
    } else if (type === "response.done" && !greetingDoneRef.current) {
      greetingDoneRef.current = true;
      // Re-enable interrupt_response now that greeting is complete
      sendEvent({
        type: "session.update",
        session: {
          audio: {
            input: {
              turn_detection: {
                type: "semantic_vad",
                eagerness: "low",
                create_response: true,
                interrupt_response: true,
              },
            },
          },
        },
      });
    } else if (type === "response.created") {
      setAgentState("processing");
    } else if (type === "response.output_audio.started") {
      setAgentState("speaking");
    } else if (type === "input_audio_buffer.speech_started") {
      setAgentState("listening");
    } else if (type === "input_audio_buffer.speech_stopped") {
      setAgentState("processing");
    } else if (type === "response.done") {
      setAgentState("idle");
    } else if (type === "response.output_item.done") {
      // Inworld sends full transcript here (no streaming text deltas)
      const item = parsed.item as { role?: string; content?: { type: string; transcript?: string }[] } | undefined;
      if (item?.role === "assistant" && item.content) {
        const transcript = item.content
          .filter((c) => c.transcript)
          .map((c) => c.transcript)
          .join(" ")
          .trim();
        if (transcript) {
          setMessages((prev) => [...prev, { role: "assistant", content: transcript }]);
        }
      }
    } else if (type === "conversation.item.input_audio_transcription.completed") {
      const transcript = (parsed.transcript as string)?.trim();
      if (transcript) {
        setMessages((prev) => [...prev, { role: "user", content: transcript }]);
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
            audio: {
              input: {
                transcription: { model: "assemblyai/universal-streaming-multilingual" },
                turn_detection: {
                  type: "semantic_vad",
                  eagerness: "low",
                  create_response: true,
                  interrupt_response: false,
                },
              },
              output: {
                model: "inworld-tts-1.5-mini",
                voice: config.voice,
              },
            },
          },
        });

        setIsConnected(true);
        // response.create sent after session.updated confirms config is applied
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

      if (!sdpRes.ok) {
        const errBody = await sdpRes.json().catch(() => ({})) as { error?: string; detail?: string };
        console.error("[useInworldRealtime] SDP error:", sdpRes.status, errBody);
        throw new Error(`SDP exchange failed: ${sdpRes.status} — ${errBody.detail ?? errBody.error ?? "unknown"}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      micStream?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
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
    greetingDoneRef.current = false;

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
