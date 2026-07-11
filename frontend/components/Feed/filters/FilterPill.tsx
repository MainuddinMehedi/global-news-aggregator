export default function FilterPill({
  label,
  value,
  onClear,
}: {
  label?: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
      <span
        className={`font-medium text-[11px] line-clamp-1 max-w-[150px] ${!label ? "capitalize" : ""}`}
        title={value}
      >
        {label ? `${label}: ` : ""}
        {value}
      </span>
      <button
        onClick={onClear}
        className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
        title="Clear filter"
      >
        ✕
      </button>
    </div>
  );
}
