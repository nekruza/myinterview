"use client";

import { FC, useRef, useEffect } from "react";
import Image from "next/image";
import { AudioWaveform } from "./AudioWaveform";
import { Mic } from "lucide-react";

// Realistic interviewer persona
const INTERVIEWER = {
  name: "Jason Mitchell",
  title: "VP of Engineering",
};

interface VideoAreaProps {
  webcamStream: MediaStream | null;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  analyserData: Uint8Array;
  userName?: string;
  avatarUrl?: string | null;
}

export const VideoArea: FC<VideoAreaProps> = ({
  webcamStream,
  isAISpeaking,
  isUserSpeaking,
  analyserData,
  userName = "You",
  avatarUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative w-full flex-1 min-h-0 max-h-[65vh] md:max-h-none rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a1f0e] to-[#112715]">
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
        style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.4)" }}
      />

      {/* User webcam or avatar */}
      {webcamStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold transition-shadow duration-500 overflow-hidden ${isUserSpeaking ? "animate-speaking-ring" : ""}`}
            style={{
              background: avatarUrl ? "transparent" : "linear-gradient(135deg, #2dec29, #0a8a1e)",
              color: "#112715",
              boxShadow: isUserSpeaking
                ? "0 0 40px rgba(45, 236, 41, 0.4)"
                : "0 0 0 rgba(45, 236, 41, 0)",
            }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </div>
      )}

      {/* Speaking ring overlay on webcam */}
      {webcamStream && isUserSpeaking && (
        <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl animate-speaking-ring" />
      )}

      {/* User name tag */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
        {isUserSpeaking && (
          <Mic className="w-3 h-3 text-[#2dec29]" />
        )}
        <span className="text-xs text-white/80 font-medium">{userName}</span>
      </div>

      {/* User audio waveform (when no webcam) */}
      {!webcamStream && isUserSpeaking && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <AudioWaveform
            analyserData={analyserData}
            isActive={isUserSpeaking}
            variant="user"
            barCount={12}
            className="h-8"
          />
        </div>
      )}

      {/* Interviewer video avatar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
        {/* Video container */}
        <div
          className="relative w-[200px] h-[130px] max-w-[45vw] rounded-2xl overflow-hidden border transition-all duration-500"
          style={{
            borderColor: isAISpeaking
              ? "rgba(45, 236, 41, 0.25)"
              : "rgba(255, 255, 255, 0.08)",
            boxShadow: isAISpeaking
              ? "0 0 20px rgba(45, 236, 41, 0.2), 0 0 4px rgba(45, 236, 41, 0.4)"
              : "none",
          }}
        >
          {/* Speaking video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/speaking.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: isAISpeaking ? 1 : 0 }}
          />
          {/* Listening video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="/listening.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: isAISpeaking ? 0 : 1 }}
          />
          {/* Online indicator dot */}
          <span
            className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-black/60 transition-colors duration-500"
            style={{
              background: isAISpeaking ? "#2dec29" : "#6b7280",
            }}
          />
        </div>
        {/* Name tag below video */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/45 backdrop-blur-sm w-fit">
          <p className="text-xs font-semibold text-white leading-tight">
            {INTERVIEWER.name}
          </p>
          <span className="text-[10px] text-white/40">·</span>
          <p className="text-[10px] text-white/40 leading-tight">
            {INTERVIEWER.title}
          </p>
        </div>
      </div>

      {/* Connection quality indicator (top-right dots like reference) */}
      <div className="absolute top-4 right-4 z-20">
        {isUserSpeaking ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2dec29]/15 border border-[#2dec29]/25 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#2dec29] animate-pulse" />
            <span className="text-xs font-medium text-[#2dec29]">
              Listening
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
            {[0.9, 1, 0.8, 0.95, 0.7].map((opacity, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white transition-opacity duration-300"
                style={{ opacity }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Elapsed timer badge (bottom-left) */}
    </div>
  );
};
