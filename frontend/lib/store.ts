import { create } from "zustand";
import type { Article } from "@/lib/utils";

interface AppState {
  // Chat slide-over
  chatOpen: boolean;
  chatArticleContext: Article | null;
  openChat: (article?: Article) => void;
  closeChat: () => void;

  // Article detail modal
  selectedArticle: Article | null;
  openArticleDetail: (article: Article) => void;
  closeArticleDetail: () => void;

  // Feed filters
  activeCategory: string;
  searchQuery: string;
  setCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Chat slide-over
  chatOpen: false,
  chatArticleContext: null,
  openChat: (article) =>
    set({ chatOpen: true, chatArticleContext: article ?? null }),
  closeChat: () => set({ chatOpen: false }),

  // Article detail modal
  selectedArticle: null,
  openArticleDetail: (article) => set({ selectedArticle: article }),
  closeArticleDetail: () => set({ selectedArticle: null }),

  // Feed filters
  activeCategory: "all",
  searchQuery: "",
  setCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
