"use client";

import { FC } from "react";
import {
  Subtitles,
  Lightbulb,
  SkipForward,
  Pause,
  Play,
  Square,
  FileText,
  Video,
  VideoOff,
  StopCircle,
} from "lucide-react";

interface ControlBarProps {
  onToggleCaptions: () => void;
  captionsOn: boolean;
  onHint: () => void;
  hintLoading: boolean;
  onToggleCamera: () => void;
  cameraOn: boolean;
  onSkip: () => void;
  onPause: () => void;
  isPaused: boolean;
  onStop: () => void;
  onToggleNotes: () => void;
  notesOpen: boolean;
  onInterrupt?: () => void;
  isAISpeaking?: boolean;
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

const ControlButton: FC<ControlButtonProps> = ({
  icon,
  label,
  onClick,
  active,
  danger,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
    style={{
      background: danger
        ? "rgba(239, 68, 68, 0.9)"
        : active
          ? "rgba(45, 236, 41, 0.2)"
          : "rgba(255, 255, 255, 0.1)",
      border: active ? "1px solid rgba(45, 236, 41, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
    }}
  >
    {icon}
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {label}
    </span>
  </button>
);

export const ControlBar: FC<ControlBarProps> = ({
  onToggleCaptions,
  captionsOn,
  onHint,
  hintLoading,
  onToggleCamera,
  cameraOn,
  onSkip,
  onPause,
  isPaused,
  onStop,
  onToggleNotes,
  notesOpen,
  onInterrupt,
  isAISpeaking,
}) => (
  <div className="flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
    <ControlButton
      icon={<FileText className="w-4 h-4 md:w-5 md:h-5 text-white/80" />}
      label="Notes"
      onClick={onToggleNotes}
      active={notesOpen}
    />
    <ControlButton
      icon={<Subtitles className="w-4 h-4 md:w-5 md:h-5 text-white/80" />}
      label="Captions"
      onClick={onToggleCaptions}
      active={captionsOn}
    />
    <ControlButton
      icon={
        <Lightbulb
          className="w-4 h-4 md:w-5 md:h-5"
          style={{ color: hintLoading ? "#2dec29" : "rgba(255,255,255,0.8)" }}
        />
      }
      label="Get Hint"
      onClick={onHint}
      disabled={hintLoading}
    />
    <ControlButton
      icon={
        cameraOn ? (
          <Video className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
        ) : (
          <VideoOff className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
        )
      }
      label={cameraOn ? "Camera On" : "Camera Off"}
      onClick={onToggleCamera}
      active={cameraOn}
    />
    <ControlButton
      icon={<SkipForward className="w-4 h-4 md:w-5 md:h-5 text-white/80" />}
      label="Skip"
      onClick={onSkip}
    />
    {isAISpeaking && onInterrupt && (
      <ControlButton
        icon={<StopCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />}
        label="Interrupt"
        onClick={onInterrupt}
        danger
      />
    )}
    <ControlButton
      icon={
        isPaused ? (
          <Play className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
        ) : (
          <Pause className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
        )
      }
      label={isPaused ? "Resume" : "Pause"}
      onClick={onPause}
    />
    <ControlButton
      icon={<Square className="w-4 h-4 md:w-5 md:h-5 text-white" />}
      label="End Session"
      onClick={onStop}
      danger
    />
  </div>
);
