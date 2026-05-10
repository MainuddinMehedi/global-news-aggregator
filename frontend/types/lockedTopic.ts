export type NotifyMode = 'DIGEST' | 'ALERT';

export type FindingSource = 
  | 'ARTICLE'
  | 'GOOGLE'
  | 'BRAVE'
  | 'REDDIT'
  | 'RSS'
  | 'SCRAPE'
  | 'WEBPAGE';

export interface SourceConfig {
  id: string;
  type: 'internal_db' | 'google_news' | 'brave' | 'reddit' | 'rss' | 'scrape' | 'webpage';
  label: string;            // "BD PSC", "Google Careers RSS"
  enabled: boolean;
  url?: string;             // for rss, scrape, webpage types
  scraperKey?: string;      // for scrape type: key into pre-built scraper registry
  subConfig?: Record<string, string>;  // e.g. { channelId: "UCxxx" } for YouTube
  lastFetchedContent?: string;  // for webpage diff: last known content hash
  lastFetchedAt?: string;   // ISO timestamp
}

export interface LockedTopic {
  id: string;
  userId: string | null;
  displayName: string;
  userContext: string;
  aiRefinedQuery: string;
  aiQuerySummary: string;
  sources: SourceConfig[];
  searchBeyondSources: boolean;
  isActive: boolean;
  notifyEnabled: boolean;
  notifyMode: NotifyMode;
  notifyThreshold: number;
  notifyChannels: { discord: boolean; telegram: boolean };
  matchCount: number;
  lastMatchedAt: string | null;
  lastViewedAt: string | null;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicFinding {
  id: string;
  topicId: string;
  title: string;
  summary: string | null;
  sourceType: FindingSource;
  sourceUrl: string;
  sourceName: string;
  rawArticleId: string | null;
  relevanceScore: number | null;
  isRead: boolean;
  foundAt: string;
  metadata: any | null;
}
