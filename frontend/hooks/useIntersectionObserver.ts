import { useEffect, useRef } from "react";

export function useIntersectionObserver<T extends Element = HTMLDivElement>(
  callback: () => void,
  shouldObserve: boolean,
  rootMargin = "300px"
) {
  const sentinelRef = useRef<T>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !shouldObserve) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) callback();
      },
      { rootMargin }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, shouldObserve, rootMargin]);

  return sentinelRef;
}
