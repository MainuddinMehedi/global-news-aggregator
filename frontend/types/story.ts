export interface Story {
  id: string;
  slug: string;
  title: string;
  summary: string;
  timeWindow: string;
  articleCount: number;
  impact: string;
  status: string;
  regions: string[];
  themes: string[];
  sourceCount: number;
  topSources: string[];
  whyItMatters: string | null;
  keyDevelopments: Array<{
    title: string;
    date: string;
    description?: string;
  }>;
  updatedAt: string;
  trendData?: Array<{ date: string; value: number }>;
}
