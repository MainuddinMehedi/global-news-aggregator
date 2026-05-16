import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

// ─── Notification slice ───────────────────────────────────────────────────────
interface NotificationSlice {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

// ─── User slice ───────────────────────────────────────────────────────────────
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

// ─── Settings slice (Persistent) ─────────────────────────────────────────────
export type Theme = "light" | "dark" | "system";
export type ColorTheme = "maia" | "mist" | "rose" | "slate" | "sand" | "lime";
export type ResponseStyle = "concise" | "detailed";

interface SettingsState {
  theme: Theme;
  colorTheme: ColorTheme;
  isSidebarCollapsed: boolean;
  feedDefaultCategory: string;
  feedDefaultSort: string;
  articlesPerPage: number;
  compactMode: boolean;
  showBiasBadges: boolean;
  showSentiment: boolean;
  defaultAiModel: string;
  responseStyle: ResponseStyle;
  favoriteCategories: string[];
  hiddenCategories: string[];
}

interface SettingsActions {
  setSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => void;
}

type SettingsSlice = SettingsState & SettingsActions;

// ─── Global App Store ────────────────────────────────────────────────────────

type AppStore = FeedSlice &
  StorySlice &
  NotificationSlice &
  UserSlice &
  ChatSidebarSlice &
  TopicSlice &
  SettingsSlice;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ── Feed (Volatile) ──
      articleCount: 0,
      setArticleCount: (count) => set({ articleCount: count }),

      // ── Stories (Volatile) ──
      storyCount: 0,
      setStoryCount: (count) => set({ storyCount: count }),

      // ── Notifications (Volatile) ──
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),

      // ── User (Volatile) ──
      user: null,
      setUser: (user) => set({ user }),

      // ── Topic (Volatile) ──
      totalMatchCount: 0,
      lockedTopicCount: 0,
      setTotalMatchCount: (count) => set({ totalMatchCount: count }),
      setLockedTopicCount: (count) => set({ lockedTopicCount: count }),

      // ── Chat sidebar (Volatile) ──
      isChatOpen: false,
      contextArticle: null,
      openChat: () => set({ isChatOpen: true }),
      closeChat: () => set({ isChatOpen: false, contextArticle: null }),
      openChatWithContext: (article) =>
        set({ isChatOpen: true, contextArticle: article }),
      clearChatContext: () => set({ contextArticle: null }),

      // ── Settings (Persistent) ──
      theme: "system",
      colorTheme: "maia",
      isSidebarCollapsed: false,
      feedDefaultCategory: "all",
      feedDefaultSort: "newest",
      articlesPerPage: 20,
      compactMode: false,
      showBiasBadges: true,
      showSentiment: true,
      defaultAiModel: "groq-llama-3",
      responseStyle: "concise",
      favoriteCategories: [],
      hiddenCategories: [],
      setSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
    }),
    {
      name: "global-news-aggregator-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist the settings and UI status
      partialize: (state) => ({
        theme: state.theme,
        colorTheme: state.colorTheme,
        isSidebarCollapsed: state.isSidebarCollapsed,
        feedDefaultCategory: state.feedDefaultCategory,
        feedDefaultSort: state.feedDefaultSort,
        articlesPerPage: state.articlesPerPage,
        compactMode: state.compactMode,
        showBiasBadges: state.showBiasBadges,
        showSentiment: state.showSentiment,
        defaultAiModel: state.defaultAiModel,
        responseStyle: state.responseStyle,
        favoriteCategories: state.favoriteCategories,
        hiddenCategories: state.hiddenCategories,
      }),
    },
  ),
);

// ─── Selector hooks ───────────────────────────────────────────────────────────

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

// Settings selectors
export const useSettings = () => {
  const { setSetting, ...settings } = useAppStore();
  return { settings, setSetting };
};

export const useTheme = () => useAppStore((s) => s.theme);
export const useIsSidebarCollapsed = () =>
  useAppStore((s) => s.isSidebarCollapsed);
export const useSetSidebarCollapsed = () => {
  const setSetting = useAppStore((s) => s.setSetting);
  return (collapsed: boolean) => setSetting("isSidebarCollapsed", collapsed);
};
