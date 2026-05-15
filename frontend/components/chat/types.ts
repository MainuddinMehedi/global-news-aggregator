// ---------------------------------------------------------------------------
// Shared types for the Chat feature
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO timestamp — set when the message is appended */
  createdAt?: string;
}

export type ContextItemType = "article" | "topic" | "link" | "file";

export interface ContextItem {
  id: string;
  title: string;
  type: ContextItemType;
  sourceId?: string;
  sourceType?: string;
  /** Optional URL for article/link context */
  url?: string;
  /** Frozen source payload used to ground future chat turns */
  snapshot?: unknown;
}

// ---------------------------------------------------------------------------
// Voice session types — designed to be wired to a real STT/TTS API later
// ---------------------------------------------------------------------------

/** Granular status for the voice session lifecycle */
export type VoiceStatus =
  | "idle"       // session not started
  | "connecting" // establishing WebSocket / media stream
  | "listening"  // actively capturing audio from the user
  | "thinking"   // audio submitted; waiting for AI response
  | "speaking";  // AI response is being played back

export interface VoiceSessionCallbacks {
  /** Called when the user's speech has been transcribed */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Called when the AI responds (text or audio chunk) */
  onAIResponse: (text: string) => void;
  /** Called when the session ends (user dismissed or error) */
  onClose: () => void;
  /** Called on any unrecoverable error */
  onError?: (error: Error) => void;
}
