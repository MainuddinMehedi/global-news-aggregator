"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic01Icon,
  Cancel01Icon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { VoiceStatus, VoiceSessionCallbacks } from "@/types/chat";

// ---------------------------------------------------------------------------
// Waveform visualiser — pure CSS bars driven by a fake amplitude for now.
// When the real audio API is wired, replace `fakeAmplitudes` with actual
// analyser node data from an AudioContext.
// ---------------------------------------------------------------------------

function WaveformBars({ active }: { active: boolean }) {
  const BAR_COUNT = 28;
  // Heights cycle through a pattern; the bars animate independently via
  // CSS animation-delay so they feel organic even with no real audio data.
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            active
              ? "bg-primary animate-voice-bar"
              : "bg-muted-foreground/30 h-1",
          )}
          style={
            active
              ? {
                  animationDelay: `${(i * 60) % 400}ms`,
                  animationDuration: `${600 + (i % 5) * 80}ms`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transcript line — shows interim (greyed, italic) or final (solid) text.
// ---------------------------------------------------------------------------

interface TranscriptLineProps {
  text: string;
  isFinal: boolean;
}

function TranscriptLine({ text, isFinal }: TranscriptLineProps) {
  return (
    <p
      className={cn(
        "text-sm text-center max-w-sm transition-all duration-300",
        isFinal
          ? "text-foreground font-medium"
          : "text-muted-foreground italic",
      )}
    >
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Status label
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<VoiceStatus, string> = {
  idle: "Press the mic to start talking",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "AI is speaking",
};

// ---------------------------------------------------------------------------
// Main VoiceSession component
//
// Props mirror VoiceSessionCallbacks so the parent (ChatInterface) can hook
// real API calls here later without touching this component's internals.
// ---------------------------------------------------------------------------

export interface VoiceSessionProps extends VoiceSessionCallbacks {
  /** Whether this overlay is currently visible */
  isOpen: boolean;
}

export default function VoiceSession({
  isOpen,
  onTranscript,
  onAIResponse,
  onClose,
  onError,
}: VoiceSessionProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<{
    text: string;
    isFinal: boolean;
  } | null>(null);
  const [aiText, setAIText] = useState<string>("");

  // Ref to hold the media stream — will be used when real STT is wired.
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state every time the overlay is opened.
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setTranscript(null);
      setAIText("");
    } else {
      // Clean up any live stream when dismissed.
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Handlers — these are the integration points for a real STT/TTS service.
  // Right now they toggle local state so the UI is fully explorable.
  // ---------------------------------------------------------------------------

  const handleToggleMic = useCallback(async () => {
    if (status === "idle") {
      // TODO: Replace this block with real microphone capture + STT session:
      //   1. streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      //   2. Open WebSocket / call STT SDK with the stream
      //   3. On partial transcript → setTranscript({ text, isFinal: false }) + onTranscript(text, false)
      //   4. On final transcript → setTranscript({ text, isFinal: true })  + onTranscript(text, true)
      //   5. On AI response     → setAIText(text) + setStatus("speaking")   + onAIResponse(text)
      setStatus("listening");
      setTranscript({ text: "Waiting for speech…", isFinal: false });
    } else if (status === "listening") {
      // TODO: Stop capture, flush final transcript, wait for AI.
      setStatus("thinking");
      setTranscript((prev) => (prev ? { ...prev, isFinal: true } : null));

      // Simulate AI turn-around (remove when real API is wired).
      setTimeout(() => {
        const mockResponse = "I am ready to be connected to a real AI backend.";
        setAIText(mockResponse);
        setStatus("speaking");
        onAIResponse(mockResponse);

        // Auto-return to idle after "playback".
        setTimeout(() => setStatus("idle"), 2500);
      }, 1200);
    } else if (status === "speaking") {
      // TODO: Interrupt TTS playback.
      setStatus("idle");
      setAIText("");
    }
  }, [status, onAIResponse]);

  const handleClose = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("idle");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const isActive = status === "listening";
  const isBusy = status === "connecting" || status === "thinking";
  const isMicBtn = status === "idle" || status === "listening";

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-between",
        "bg-background/96 backdrop-blur-md",
        // Animate in
        "animate-in fade-in duration-200",
      )}
      aria-modal="true"
      aria-label="Voice session"
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="w-full h-14 flex items-center justify-between px-4 shrink-0">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground select-none">
          Voice Mode
        </span>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close voice session"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
        </button>
      </div>

      {/* ── Centre area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 w-full max-w-sm">
        {/* Status label */}
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-widest transition-colors duration-300",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          {STATUS_LABELS[status]}
        </p>

        {/* Waveform — only shown while capturing audio */}
        <div className="w-full">
          <WaveformBars active={isActive} />
        </div>

        {/* Transcript / AI text */}
        <div className="min-h-[48px] flex items-center justify-center w-full">
          {status === "speaking" && aiText ? (
            <p className="text-sm text-center text-foreground font-medium animate-in fade-in">
              {aiText}
            </p>
          ) : transcript ? (
            <TranscriptLine
              text={transcript.text}
              isFinal={transcript.isFinal}
            />
          ) : null}
        </div>
      </div>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 pb-14 shrink-0">
        {/* Primary mic / stop button */}
        <button
          onClick={handleToggleMic}
          disabled={isBusy}
          aria-label={isActive ? "Stop recording" : "Start recording"}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center",
            "transition-all duration-300 disabled:opacity-50",
            isActive
              ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40 scale-105"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
          )}
        >
          {/* Pulse ring — only while listening */}
          {isActive && (
            <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
          )}
          <HugeiconsIcon
            icon={isActive ? StopCircleIcon : Mic01Icon}
            className="w-9 h-9 relative z-10"
          />
        </button>
      </div>
    </div>
  );
}
