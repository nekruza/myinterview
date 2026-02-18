"use client";

import { FC, useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Mic, MicOff, AlertTriangle } from "lucide-react";
import { useTimer } from "@/lib/hooks/useTimer";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/hooks/useSpeechSynthesis";
import { useAudioVisualizer } from "@/lib/hooks/useAudioVisualizer";
import { VideoArea } from "./VideoArea";
import { TranscriptPanel } from "./TranscriptPanel";
import { ControlBar } from "./ControlBar";
import { HintOverlay } from "./HintOverlay";
import { NotesPanel } from "./NotesPanel";
import { SessionTimer } from "./SessionTimer";
import type { Message } from "@/lib/practice-data";
import { LEVELS } from "@/lib/practice-data";

interface JobContext {
  mode: "link" | "paste" | "general";
  value: string;
}

interface VoiceCallViewProps {
  selectedCategory: { id: string; label: string; color: string };
  selectedQuestion: string;
  level: string;
  role?: string;
  sessionId: string | null;
  interviewType?: "technical" | "behavioural";
  jobContext?: JobContext;
  resumeText?: string;
  onComplete: (messages: Message[], duration: string) => void;
  onReset: () => void;
}

type ConversationState =
  | "initializing"
  | "ai_speaking"
  | "listening"
  | "processing"
  | "paused"
  | "ending";

export const VoiceCallView: FC<VoiceCallViewProps> = ({
  selectedCategory,
  selectedQuestion,
  level,
  role,
  sessionId,
  interviewType,
  jobContext,
  resumeText,
  onComplete,
  onReset,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [convState, setConvState] = useState<ConversationState>("initializing");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [autoSend, setAutoSend] = useState(false);

  const timer = useTimer();
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const visualizer = useAudioVisualizer();

  // Ref so cleanup effects always see the live stream regardless of closure capture
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const convStateRef = useRef(convState);
  convStateRef.current = convState;

  // Silence detection: when user stops speaking
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFinalTranscriptRef = useRef("");

  // ── Initialize: request media, start session ──
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Request mic (required) + camera (optional)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        // Permission granted — always record this (state persists across Strict Mode re-mounts)
        setMicPermission(true);
        if (mounted) {
          setWebcamStream(stream);
          webcamStreamRef.current = stream;
          // Start audio visualizer with mic stream
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            const audioStream = new MediaStream([audioTrack]);
            visualizer.startAnalyser(audioStream);
          }
        } else {
          // Strict Mode cleanup already ran — release the orphaned stream
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // Try audio only
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setMicPermission(true);
          if (mounted) {
            webcamStreamRef.current = stream;
            visualizer.startAnalyser(stream);
          } else {
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          // Only mark denied if no prior init already succeeded
          setMicPermission((prev) => (prev === true ? true : false));
        }
      }

      // Start timer
      if (mounted) {
        timer.start();

        // Send initial AI message
        await sendToAI([
          {
            role: "user",
            content: `[SESSION START] I'm a ${LEVELS.find((l) => l.value === level)?.label} engineer. Please present the practice question and guide me through the session.`,
          },
        ]);
      }
    };

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stream AI response ──
  const sendToAI = useCallback(
    async (msgs: Message[], isHint = false) => {
      if (!isHint) {
        setConvState("processing");
      }

      const assistantPlaceholder: Message = { role: "assistant", content: "" };
      if (!isHint) {
        setMessages((prev) => [...prev, assistantPlaceholder]);
      }

      let fullText = "";

      try {
        const res = await fetch("/api/ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            question: selectedQuestion,
            category: selectedCategory.id,
            level,
            role,
            sessionId,
            isHint,
            interviewType,
            jobContext,
            resumeText,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;

            try {
              const { text, error } = JSON.parse(payload);
              if (error) throw new Error(error);
              if (text) {
                fullText += text;
                if (!isHint) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content:
                        updated[updated.length - 1].content + text,
                    };
                    return updated;
                  });
                }
              }
            } catch {
              // skip malformed
            }
          }
        }

        if (isHint) {
          return fullText;
        }

        // Speak the response via TTS
        const stateBeforeSpeak = convStateRef.current as ConversationState;
        if (fullText && stateBeforeSpeak !== "ending") {
          setConvState("ai_speaking");
          await speakAndWait(fullText);
          // After AI finishes speaking, start listening
          const stateAfterSpeak = convStateRef.current as ConversationState;
          if (stateAfterSpeak !== "ending" && stateAfterSpeak !== "paused") {
            startListeningToUser();
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI error";
        toast.error(msg);
        if (!isHint) {
          setMessages((prev) => prev.slice(0, -1));
        }
        // Try to recover to listening state
        const stateOnError = convStateRef.current as ConversationState;
        if (stateOnError !== "ending") {
          startListeningToUser();
        }
      }

      return fullText;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, selectedQuestion, selectedCategory.id, level]
  );

  // ── Speak and wait for completion (promise-based) ──
  const speakAndWait = useCallback(
    async (text: string): Promise<void> => {
      // Stop recognition BEFORE TTS to prevent mic picking up AI voice
      speech.stopListening();
      await tts.speakAsync(text);
    },
    [tts, speech]
  );

  // ── Start listening to user ──
  const startListeningToUser = useCallback(() => {
    setConvState("listening");
    speech.resetTranscript();
    lastFinalTranscriptRef.current = "";
    speech.startListening();
  }, [speech]);

  // Keep refs for values needed inside silence timeout callback
  const speechRef = useRef(speech);
  speechRef.current = speech;
  const sendToAIRef = useRef(sendToAI);
  sendToAIRef.current = sendToAI;

  // ── Toggle auto-send (clears pending timer when turning off) ──
  const handleToggleAutoSend = useCallback(() => {
    setAutoSend((prev) => {
      if (prev && silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      return !prev;
    });
  }, []);

  // ── Watch for user finishing speaking (silence detection) ──
  useEffect(() => {
    if (convState !== "listening") return;
    if (!autoSend) return;

    const currentFinal = speech.finalTranscript;

    // When we get new final transcript text, reset silence timer
    if (currentFinal && currentFinal !== lastFinalTranscriptRef.current) {
      lastFinalTranscriptRef.current = currentFinal;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Wait 2s of silence after last final transcript before sending
      silenceTimerRef.current = setTimeout(() => {
        const latestTranscript = speechRef.current.finalTranscript.trim();
        if (convStateRef.current === "listening" && latestTranscript) {
          speechRef.current.stopListening();
          const userMsg: Message = { role: "user", content: latestTranscript };
          const updatedMsgs = [...messagesRef.current, userMsg];
          setMessages(updatedMsgs);
          sendToAIRef.current(updatedMsgs);
        }
      }, 2000);
    }

    // Only clean up on unmount or when convState leaves "listening"
    // Do NOT clean up when finalTranscript changes (that would kill the timer)
  }, [convState, speech.finalTranscript, autoSend]);

  // Clean up silence timer when leaving listening state
  useEffect(() => {
    if (convState !== "listening" && silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [convState]);

  // ── Manual send (fallback when silence detection doesn't fire) ──
  const handleManualSend = useCallback(() => {
    const transcript = (speech.finalTranscript + speech.transcript).trim();
    if (!transcript || convStateRef.current !== "listening") return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    speech.stopListening();
    const userMsg: Message = { role: "user", content: transcript };
    const updatedMsgs = [...messagesRef.current, userMsg];
    setMessages(updatedMsgs);
    sendToAI(updatedMsgs);
  }, [speech, sendToAI]);

  // ── Hint handler ──
  const handleHint = useCallback(async () => {
    setHintLoading(true);
    try {
      const hint = await sendToAI(messagesRef.current, true);
      if (hint) setCurrentHint(hint);
    } finally {
      setHintLoading(false);
    }
  }, [sendToAI]);

  // ── Pause / Resume ──
  const handlePause = useCallback(() => {
    if (convState === "paused") {
      timer.start();
      startListeningToUser();
    } else {
      setConvState("paused");
      timer.pause();
      speech.stopListening();
      tts.cancel();
    }
  }, [convState, timer, speech, tts, startListeningToUser]);

  // ── Stop / End session ──
  const handleStop = useCallback(() => {
    setConvState("ending");
    timer.pause();
    speech.stopListening();
    tts.cancel();
    setShowEndModal(true);
  }, [timer, speech, tts]);

  // ── Toggle camera ──
  const handleToggleCamera = useCallback(() => {
    const stream = webcamStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const enabled = !videoTracks[0].enabled;
    videoTracks.forEach((t) => (t.enabled = enabled));
    setCameraOn(enabled);
  }, []);

  // ── Skip (ask next question) ──
  const handleSkip = useCallback(() => {
    speech.stopListening();
    tts.cancel();
    const skipMsg: Message = {
      role: "user",
      content: "Let's move on to the next aspect of this question. What else should I think about?",
    };
    const updated = [...messagesRef.current, skipMsg];
    setMessages(updated);
    sendToAI(updated);
  }, [speech, tts, sendToAI]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      speech.stopListening();
      tts.cancel();
      visualizer.stopAnalyser();
      timer.pause();
      // Stop all media tracks so the browser camera/mic indicator goes off
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Browser not supported ──
  if (!speech.isSupported) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1f0e] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Browser Not Supported
          </h2>
          <p className="text-white/60 mb-6">
            Voice practice requires the Web Speech API, which is currently only
            supported in Chrome and Edge browsers.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#2dec29] text-[#112715] hover:opacity-90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a1f0e] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: selectedCategory.color }}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {selectedCategory.label}
            </p>
            <p className="text-sm text-white/80 truncate max-w-md">
              {selectedQuestion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* State indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
            {convState === "listening" && (
              <>
                <Mic className="w-3.5 h-3.5 text-[#2dec29]" />
                <span className="text-xs text-[#2dec29] font-medium">
                  Your turn
                </span>
              </>
            )}
            {convState === "ai_speaking" && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-medium">
                  Maria is speaking
                </span>
              </>
            )}
            {convState === "processing" && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs text-yellow-400 font-medium">
                  Maria is thinking...
                </span>
              </>
            )}
            {convState === "initializing" && (
              <>
                <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
                <span className="text-xs text-white/40 font-medium">
                  Connecting...
                </span>
              </>
            )}
            {convState === "paused" && (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs text-orange-400 font-medium">
                  Paused
                </span>
              </>
            )}
          </div>

          <SessionTimer formatted={timer.formatted} isRunning={timer.isRunning} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex gap-4 px-6 pb-4 min-h-0 relative">
        {/* Video + controls column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
          {/* Inline mic permission banner */}
          {micPermission === false && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/25 mb-1">
              <MicOff className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                Microphone access denied — allow it in your browser and refresh.
              </p>
            </div>
          )}
          {speech.error && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/25 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300">{speech.error}</p>
            </div>
          )}

          <VideoArea
            webcamStream={webcamStream}
            isAISpeaking={convState === "ai_speaking"}
            isUserSpeaking={convState === "listening" && speech.isListening}
            analyserData={visualizer.analyserData}
          />

          {/* Hint overlay (positioned inside video area) */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-20">
            <div className="pointer-events-auto">
              <HintOverlay
                hint={currentHint}
                onDismiss={() => setCurrentHint(null)}
              />
            </div>
          </div>

          {/* Auto-send toggle + manual send button */}
          {convState === "listening" && (
            <div className="shrink-0 flex items-center justify-center gap-3">
              {/* Auto-send toggle */}
              <button
                onClick={handleToggleAutoSend}
                title={autoSend ? "Auto-send is on — message sends after 2 s of silence. Click to require manual send." : "Auto-send is off — click Send to submit your message. Click to turn auto-send back on."}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition"
                style={{
                  background: autoSend ? "rgba(45,236,41,0.12)" : "rgba(255,255,255,0.05)",
                  borderColor: autoSend ? "rgba(45,236,41,0.35)" : "rgba(255,255,255,0.15)",
                  color: autoSend ? "#2dec29" : "rgba(255,255,255,0.45)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: autoSend ? "#2dec29" : "rgba(255,255,255,0.3)" }}
                />
                Auto-send {autoSend ? "on" : "off"}
              </button>

              {/* Manual send — shown when there's transcript */}
              {(speech.finalTranscript || speech.transcript) && (
                <button
                  onClick={handleManualSend}
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition hover:opacity-90 active:scale-95"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  <Mic className="w-4 h-4" />
                  Send
                </button>
              )}
            </div>
          )}

          {/* Control bar */}
          <div className="shrink-0 flex justify-center">
            <ControlBar
              onToggleCaptions={() => setShowCaptions((v) => !v)}
              captionsOn={showCaptions}
              onHint={handleHint}
              hintLoading={hintLoading}
              onToggleCamera={handleToggleCamera}
              cameraOn={cameraOn}
              onSkip={handleSkip}
              onPause={handlePause}
              isPaused={convState === "paused"}
              onStop={handleStop}
              onToggleNotes={() => setShowNotes((v) => !v)}
              notesOpen={showNotes}
            />
          </div>
        </div>

        {/* Transcript side panel */}
        <TranscriptPanel
          messages={messages}
          interimTranscript={convState === "listening" ? (speech.finalTranscript + speech.transcript).trim() : ""}
          isActivelyListening={convState === "listening" && !!speech.transcript}
          isVisible={showCaptions}
        />
      </div>

      {/* Notes panel */}
      <NotesPanel isOpen={showNotes} onClose={() => setShowNotes(false)} />

      {/* End session modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#112715] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              End Session
            </h3>
            <p className="text-sm text-white/60 mb-5">
              Your session will be saved and scored by AI.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEndModal(false);
                  setConvState("listening");
                  timer.start();
                  startListeningToUser();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/20 text-white/60 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
                  webcamStreamRef.current = null;
                  visualizer.stopAnalyser();
                  onComplete(messagesRef.current, timer.formatted);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
