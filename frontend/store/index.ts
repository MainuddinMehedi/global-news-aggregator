import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
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

// ─── Auth slice ───────────────────────────────────────────────────────────────
interface AuthSlice {
  isLoginModalOpen: boolean;
  setLoginModalOpen: (isOpen: boolean) => void;
}

// ─── Topic slice ──────────────────────────────────────────────────────────────
interface TopicSlice {
  totalMatchCount: number;
  lockedTopicCount: number;
  setTotalMatchCount: (count: number) => void;
  setLockedTopicCount: (count: number) => void;
}

// ─── Floating chat slice ─────────────────────────────────────────────────────
interface FloatingChatSlice {
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
export type ColorTheme = "maia" | "ember" | "iris" | "pine" | "slate";
export type ResponseStyle = "concise" | "detailed";

export type HomePageMode = "continuous" | "daily";

export interface CustomSource {
  id: string;
  name: string;
  url: string;
  country: string;
  sourceOrigin: string;
  sourceType: string;
  biasGroup: string;
  coverageScope: string;
  enabled: boolean;
}

export interface SettingsState {
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
  extraCategories: string[];
  homePageMode: HomePageMode;
  hasOnboardedSources: boolean;
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
  FloatingChatSlice &
  TopicSlice &
  AuthSlice &
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

      // ── Auth (Volatile) ──
      isLoginModalOpen: false,
      setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),

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
      defaultAiModel: "groq/compound",
      responseStyle: "concise",
      favoriteCategories: [],
      hiddenCategories: [],
      extraCategories: [],
      homePageMode: "continuous",
      hasOnboardedSources: false,
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
        extraCategories: state.extraCategories,
        homePageMode: state.homePageMode,
        hasOnboardedSources: state.hasOnboardedSources,
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

export const useIsLoginModalOpen = () => useAppStore((s) => s.isLoginModalOpen);
export const useSetLoginModalOpen = () =>
  useAppStore((s) => s.setLoginModalOpen);

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
  const settings = useAppStore(
    useShallow((s) => ({
      theme: s.theme,
      colorTheme: s.colorTheme,
      isSidebarCollapsed: s.isSidebarCollapsed,
      feedDefaultCategory: s.feedDefaultCategory,
      feedDefaultSort: s.feedDefaultSort,
      articlesPerPage: s.articlesPerPage,
      compactMode: s.compactMode,
      showBiasBadges: s.showBiasBadges,
      showSentiment: s.showSentiment,
      defaultAiModel: s.defaultAiModel,
      responseStyle: s.responseStyle,
      favoriteCategories: s.favoriteCategories,
      hiddenCategories: s.hiddenCategories,
      extraCategories: s.extraCategories,
      homePageMode: s.homePageMode,
      hasOnboardedSources: s.hasOnboardedSources,
    })),
  );
  const setSetting = useAppStore((s) => s.setSetting);
  return { settings, setSetting };
};

export const useTheme = () => useAppStore((s) => s.theme);
export const useIsSidebarCollapsed = () =>
  useAppStore((s) => s.isSidebarCollapsed);
export const useSetSidebarCollapsed = () => {
  const setSetting = useAppStore((s) => s.setSetting);
  return (collapsed: boolean) => setSetting("isSidebarCollapsed", collapsed);
};
