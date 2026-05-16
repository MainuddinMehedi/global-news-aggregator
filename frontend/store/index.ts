import { create } from "zustand";
import type { Article } from "@/types/article";

// ─── Feed slice ───────────────────────────────────────────────────────────────
interface FeedSlice {
  articleCount: number;
  setArticleCount: (count: number) => void;
}

// ─── Story slice ──────────────────────────────────────────────────────────────
interface StorySlice {
  storyCount: number;
  setStoryCount: (count: number) => void;
}

// ─── Notification slice (stub — wire up when notifications are built) ─────────
interface NotificationSlice {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

// ─── User slice (stub — wire up when auth is built) ───────────────────────────
interface UserSlice {
  user: null; // replace with a real User type when auth is implemented
  setUser: (user: null) => void;
}

// ─── Topic slice ──────────────────────────────────────────────────────────────
interface TopicSlice {
  totalMatchCount: number;
  lockedTopicCount: number;
  setTotalMatchCount: (count: number) => void;
  setLockedTopicCount: (count: number) => void;
}

// ─── Chat sidebar slice ──────────────────────────────────────────────────────
interface ChatSidebarSlice {
  isChatOpen: boolean;
  /** Article context when opened from an article card's AI button */
  contextArticle: Article | null;
  openChat: () => void;
  closeChat: () => void;
  /** Open sidebar with a specific article pre-loaded as context */
  openChatWithContext: (article: Article) => void;
  clearChatContext: () => void;
}

// ─── UI Status slice ────────────────────────────────────────────────────────
interface UIStatusSlice {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

type AppStore = FeedSlice &
  StorySlice &
  NotificationSlice &
  UserSlice &
  ChatSidebarSlice &
  TopicSlice &
  UIStatusSlice;

export const useAppStore = create<AppStore>()((set) => ({
  // ── UI Status ──
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // ── Feed ──
  articleCount: 0,
  setArticleCount: (count) => set({ articleCount: count }),

  // ── Stories ──
  storyCount: 0,
  setStoryCount: (count) => set({ storyCount: count }),

  // ── Notifications ──
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // ── User ──
  user: null,
  setUser: (user) => set({ user }),

  // ── Topic ──
  totalMatchCount: 0,
  lockedTopicCount: 0,
  setTotalMatchCount: (count) => set({ totalMatchCount: count }),
  setLockedTopicCount: (count) => set({ lockedTopicCount: count }),

  // ── Chat sidebar ──
  isChatOpen: false,
  contextArticle: null,
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false, contextArticle: null }),
  openChatWithContext: (article) =>
    set({ isChatOpen: true, contextArticle: article }),
  clearChatContext: () => set({ contextArticle: null }),
}));

// ─── Selector hooks ───────────────────────────────────────────────────────────
// Always use these instead of useAppStore directly. Each selector returns only
// the specific value it needs, so a component won't re-render when unrelated
// parts of the store change.

export const useArticleCount = () => useAppStore((s) => s.articleCount);
export const useSetArticleCount = () => useAppStore((s) => s.setArticleCount);
export const useStoryCount = () => useAppStore((s) => s.storyCount);
export const useSetStoryCount = () => useAppStore((s) => s.setStoryCount);
export const useUnreadCount = () => useAppStore((s) => s.unreadCount);
export const useSetUnreadCount = () => useAppStore((s) => s.setUnreadCount);

export const useIsChatOpen = () => useAppStore((s) => s.isChatOpen);
export const useOpenChat = () => useAppStore((s) => s.openChat);
export const useCloseChat = () => useAppStore((s) => s.closeChat);
export const useOpenChatWithContext = () =>
  useAppStore((s) => s.openChatWithContext);
export const useClearChatContext = () => useAppStore((s) => s.clearChatContext);
export const useChatContextArticle = () => useAppStore((s) => s.contextArticle);

export const useTotalMatchCount = () => useAppStore((s) => s.totalMatchCount);
export const useSetTotalMatchCount = () =>
  useAppStore((s) => s.setTotalMatchCount);
export const useLockedTopicCount = () => useAppStore((s) => s.lockedTopicCount);
export const useSetLockedTopicCount = () =>
  useAppStore((s) => s.setLockedTopicCount);

export const useIsSidebarCollapsed = () =>
  useAppStore((s) => s.isSidebarCollapsed);
export const useSetSidebarCollapsed = () =>
  useAppStore((s) => s.setSidebarCollapsed);
