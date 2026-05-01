import { Sparkles } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentimentBadge } from "./SentimentBadge";
import { Article } from "@/types/article";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 hover:border-zinc-600 transition-all duration-200 group cursor-pointer flex flex-col h-full"
      // onClick={() => openArticleDetail(article)}
    >
      {/* Title row with AI button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-zinc-100 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
          {article.title}
        </h3>
        <button
          // onClick={(e) => {
          //   e.stopPropagation();
          //   openChat(article);
          // }}
          className="shrink-0 p-1.5 rounded-md text-zinc-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all opacity-80 group-hover:opacity-100"
          title="Ask AI about this article"
        >
          <HugeiconsIcon icon={Sparkles} className="w-4 h-4" />
        </button>
      </div>

      {/* Source · Time · Sentiment */}
      <div className="flex items-center space-x-2 mb-3 text-xs">
        <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-500">
          AL
          {/*{article.source.substring(0, 2).toUpperCase()}*/}
        </div>
        <span className="font-medium text-zinc-400">Al Jazeera</span>{" "}
        {/* {article.source} */}
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-600 font-mono text-[10px]">
          4h ago
          {/*{formatRelativeTime(article.publishedAt)}*/}
        </span>
        <span className="text-zinc-700">·</span>
        <SentimentBadge score={2} /> {/* {article.sentimentScore} */}
      </div>

      {/* Snippet */}
      <p className="text-sm text-zinc-500 line-clamp-3 mb-3 flex-1">
        {/*{article.contentSnippet}*/}
        This message follows conventional commit standards and clearly
        summarizes the architectural shift from page-based layouts to a global
        app shell.
      </p>

      {/* Category tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[10px] font-medium capitalize"
          >
            cat
          </span>
        ))}
      </div>

      {/*{article.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {article.categories.slice(0, 3).map((cat) => (
            <span
              key={cat.id}
              className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[10px] font-medium capitalize"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}*/}

      {/* Footer: Bias + Perspective */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
        {/*<div className="flex items-center space-x-2">
          <BiasIndicator biasCategory={article.biasCategory} />
          {article.perspectiveCountries.length > 0 && (
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">
                {article.perspectiveCountries.slice(0, 3).join(", ")}
              </span>
            </div>
          )}
        </div>*/}
      </div>
    </div>
    // <div className="bg-card shadow-md rounded-lg p-4">
    //   <h2 className="text-xl font-bold">
    //     Global Climate Summit Reaches Historic Accord on Emissions
    //   </h2>
    // </div>
  );
}
