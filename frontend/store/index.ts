import { create } from "zustand";

// ─── Feed slice ───────────────────────────────────────────────────────────────
interface FeedSlice {
  articleCount: number;
  setArticleCount: (count: number) => void;
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

type AppStore = FeedSlice & NotificationSlice & UserSlice;

export const useAppStore = create<AppStore>()((set) => ({
  // ── Feed ──
  articleCount: 0,
  setArticleCount: (count) => set({ articleCount: count }),

  // ── Notifications ──
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // ── User ──
  user: null,
  setUser: (user) => set({ user }),
}));

// ─── Selector hooks ───────────────────────────────────────────────────────────
// Always use these instead of useAppStore directly. Each selector returns only
// the specific value it needs, so a component won't re-render when unrelated
// parts of the store change.

export const useArticleCount    = () => useAppStore((s) => s.articleCount);
export const useSetArticleCount = () => useAppStore((s) => s.setArticleCount);
export const useUnreadCount     = () => useAppStore((s) => s.unreadCount);
export const useSetUnreadCount  = () => useAppStore((s) => s.setUnreadCount);
