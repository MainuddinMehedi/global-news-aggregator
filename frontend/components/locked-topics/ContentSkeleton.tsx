export function ContentSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <p className="text-xs text-muted-foreground pt-4 text-center italic">
        {message}
      </p>
    </div>
  );
}
