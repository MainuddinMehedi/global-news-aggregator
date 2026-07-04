interface ConceptBucketsListProps {
  buckets: string[][];
}

export function ConceptBucketsList({ buckets }: ConceptBucketsListProps) {
  if (!buckets || buckets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {buckets.map((group, i) => (
        <div
          key={i}
          className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 flex flex-wrap gap-1 items-center"
        >
          {group.map((term, j) => (
            <span key={j} className="text-[9px] font-bold text-primary">
              {term}
              {j < group.length - 1 && (
                <span className="ml-1 text-muted-foreground/50">+</span>
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
