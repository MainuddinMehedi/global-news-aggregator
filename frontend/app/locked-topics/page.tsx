import Link from "next/link";
import { LockedIcon, LockSync01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { TopicActions } from "../../components/locked-topics/TopicActions";

const initialTopics = [
  {
    id: "1",
    name: "iran-israel",
    active: true,
    matchCount: 45,
    unread: 3,
    lastUpdated: "2h ago",
    findings: [
      "New diplomatic efforts underway in Geneva.",
      "Border skirmishes reported despite ceasefire.",
    ],
  },
  {
    id: "2",
    name: "bangladesh-budget",
    active: true,
    matchCount: 12,
    unread: 0,
    lastUpdated: "5h ago",
    findings: [
      "Subsidies cut across multiple sectors.",
      "IMF expresses satisfaction with early reforms.",
    ],
  },
  {
    id: "3",
    name: "us-china-trade",
    active: false,
    matchCount: 89,
    unread: 0,
    lastUpdated: "1d ago",
    findings: ["Tech sanctions debated in Congress."],
  },
  {
    id: "4",
    name: "ukraine-russia",
    active: true,
    matchCount: 120,
    unread: 12,
    lastUpdated: "10m ago",
    findings: [],
  },
];

export default function LockedTopicsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm backdrop-blur-md">
            <HugeiconsIcon icon={LockedIcon} className="h-3.5 w-3.5" />
            Monitoring
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Locked Topics
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Pin specific geopolitical themes to ensure they are persistently
            tracked. You will receive notifications when significant matches are
            found.
          </p>
        </div>

        <button className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0">
          <HugeiconsIcon
            icon={PlusSignIcon}
            className="h-4 w-4 transition-transform group-hover:rotate-90"
          />
          Lock New Topic
        </button>
      </div>

      {/* Grid of Topics */}
      <div className="grid gap-4 md:grid-cols-2">
        {initialTopics.map((topic) => (
          <div
            key={topic.id}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card/50 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
              topic.active
                ? "border-border hover:border-primary/40 hover:shadow-primary/5"
                : "border-border/50 opacity-75 hover:opacity-100"
            }`}
          >
            <Link 
              href={`/locked-topics/${topic.id}`} 
              className="absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
              aria-label={`View details for ${topic.name}`} 
            />

            {/* Background Glow when Active */}
            {topic.active && (
              <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            )}

            {/* Main Card Content */}
            <div className="pointer-events-none relative z-10 flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                    topic.active
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/30 text-muted-foreground group-hover:bg-muted/50"
                  }`}
                >
                  <HugeiconsIcon icon={LockSync01Icon} className="h-5 w-5" />
                </div>

                {/* Topic Info */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold leading-none text-foreground transition-colors group-hover:text-primary">
                    {topic.name}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                    <span className={topic.active ? "text-foreground/80" : ""}>
                      {topic.matchCount} Matches
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border/80"></span>
                    <span>Last: {topic.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* Actions & Toggle */}
              <div className="pointer-events-auto">
                <TopicActions
                  id={topic.id}
                  initialActive={topic.active}
                  unread={topic.unread}
                />
              </div>
            </div>

            {/* Findings Section */}
            <div className="pointer-events-none relative z-10 flex min-h-[80px] flex-col justify-center border-t border-border/50 bg-muted/20 px-5 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Latest Findings
              </p>
              {topic.findings && topic.findings.length > 0 ? (
                <ul className="space-y-2">
                  {topic.findings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                      <span className="leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground/60">
                  No findings yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
