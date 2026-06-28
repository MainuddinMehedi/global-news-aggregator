"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function UserSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative max-w-md w-full">
      <Input
        type="text"
        placeholder="Search users by name or email..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          handleSearch(e.target.value);
        }}
        className="w-full bg-muted/40 border-border/50 rounded-xl pr-9 pl-4 text-sm focus:border-primary/50 focus:ring-primary/20"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isPending && (
          <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {!isPending && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </div>
    </div>
  );
}
