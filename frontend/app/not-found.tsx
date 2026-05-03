import { AlertCircle, ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full bg-background px-6 text-center">
      <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
          <HugeiconsIcon
            icon={AlertCircle}
            className="w-10 h-10 text-muted-foreground"
          />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-6xl font-black tracking-tighter text-primary">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground leading-relaxed">
            The page you&apos;re looking for has been moved, deleted, or never
            existed. Don&apos;t let it break your news cycle.
          </p>
        </div>

        {/* Action */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl px-8 py-3.5 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"
          >
            <HugeiconsIcon icon={ArrowLeft} className="w-5 h-5" />
            Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
