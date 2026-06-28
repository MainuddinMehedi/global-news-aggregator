export interface FeedQueryParams {
  category: string;
  sort: string;
  search: string;
  region: string;
  origin: string;
  type: string;
  story: string;
  bias: string;
  scope: string;
  cursor?: string | null;
  date?: string;
}

export function buildFeedQueryParams(opts: FeedQueryParams): URLSearchParams {
  const params = new URLSearchParams({ 
    category: opts.category, 
    sort: opts.sort, 
    search: opts.search 
  });
  
  if (opts.region && opts.region !== "all") params.set("region", opts.region);
  if (opts.origin && opts.origin !== "all") params.set("origin", opts.origin);
  if (opts.type && opts.type !== "all") params.set("type", opts.type);
  if (opts.story && opts.story !== "all") params.set("story", opts.story);
  if (opts.bias && opts.bias !== "all") params.set("bias", opts.bias);
  if (opts.scope && opts.scope !== "all") params.set("scope", opts.scope);
  
  if (opts.date) {
    params.set("date", opts.date);
  }

  if (opts.cursor) {
    // Search uses offset-based pagination (page), default uses cursor-based
    if (opts.search) {
      params.set("page", opts.cursor);
    } else {
      params.set("cursor", opts.cursor);
    }
  }

  return params;
}
