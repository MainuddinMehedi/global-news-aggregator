import { useOpenChatWithContext } from "@/store";
import { Article } from "@/types/article";
import { Sparkles } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function AiButton({ article }: { article: Article }) {
  const openChatWithContext = useOpenChatWithContext();

  return (
    <button
      onClick={() => openChatWithContext(article)}
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-all opacity-80 group-hover:opacity-100"
      title="Ask AI about this article"
    >
      <HugeiconsIcon icon={Sparkles} className="w-4 h-4" />
    </button>
  );
}
