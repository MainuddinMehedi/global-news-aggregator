import { isToolUIPart, getToolName, type UIMessage } from "ai";

export type SourceItem = {
  label: string;
  value: string;
  type: string;
  snippet?: string;
  published?: string;
  source?: string;
  sourceId?: string;
  mediaType?: string;
  engine?: string;
  toolName?: string;
};

export function isSourceResourcePart(part: UIMessage["parts"][number]): part is
  | { type: "source-url"; url: string; title?: string; sourceId: string }
  | {
      type: "source-document";
      sourceId: string;
      mediaType: string;
      title: string;
      filename?: string;
    } {
  return part.type === "source-url" || part.type === "source-document";
}

export function formatResourcePart(part: UIMessage["parts"][number]): SourceItem {
  if (part.type === "source-url") {
    return {
      label: part.title || part.url,
      value: part.url,
      type: "source-url" as const,
      sourceId: part.sourceId,
    };
  }

  if (part.type === "source-document") {
    return {
      label: part.title,
      value: part.filename ?? part.sourceId,
      type: "source-document" as const,
      mediaType: part.mediaType,
      sourceId: part.sourceId,
    };
  }

  return {
    label: "Unknown resource",
    value: JSON.stringify(part),
    type: "unknown" as const,
  };
}

export function extractToolResources(parts: UIMessage["parts"]): SourceItem[] {
  const items: SourceItem[] = [];

  for (const part of parts) {
    if (!isToolUIPart(part)) continue;

    const toolName = getToolName(part);
    const tp = part as {
      state: string;
      output?: Record<string, unknown>;
    };

    if (tp.state !== "output-available" || !tp.output) continue;

    const out = tp.output as {
      url?: string;
      title?: string;
      description?: string;
      content?: string;
      published?: string;
      source?: string;
      engine?: string;
      results?: Array<{
        url: string;
        title?: string;
        snippet?: string;
        published?: string;
        source?: string;
      }>;
    };

    if (out.results) {
      for (const r of out.results) {
        items.push({
          label: r.title || r.url,
          value: r.url,
          type: "source-url",
          snippet: r.snippet,
          published: r.published,
          source: r.source,
          engine: out.engine,
          toolName,
        });
      }
    }

    if (out.url && !items.some((i) => i.value === out.url)) {
      items.push({
        label: out.title || out.url,
        value: out.url,
        type: "source-url",
        snippet: out.description || out.content,
        published: out.published,
        source: out.source,
        engine: out.engine,
        toolName,
      });
    }
  }

  return items;
}

export function dedupeSources(sources: SourceItem[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = source.value.replace(/\/$/, "");

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}
