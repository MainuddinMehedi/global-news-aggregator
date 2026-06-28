"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ElementType, ReactNode } from "react";

interface NotificationDropdownShellProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  trigger: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerIcon: any;
  headerTitle: string;
  onMarkAllRead: () => void;
  isLoading: boolean;
  hasItems: boolean;
  showClearAll: boolean;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: ReactNode;
}

export function NotificationDropdownShell({
  isOpen,
  setIsOpen,
  trigger,
  headerIcon,
  headerTitle,
  onMarkAllRead,
  isLoading,
  hasItems,
  showClearAll,
  footerLinkHref,
  footerLinkLabel,
  children,
}: NotificationDropdownShellProps) {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 rounded-2xl border-secondary shadow-2xl overflow-hidden"
        align="end"
      >
        <div className="p-4 border-b border-secondary bg-secondary/5 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <HugeiconsIcon icon={headerIcon} size={16} className="text-primary" />
            {headerTitle}
          </h3>

          {showClearAll && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={onMarkAllRead}
            >
              <HugeiconsIcon icon={Tick01Icon} size={14} className="mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[350px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-1/2 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : hasItems ? (
            <div className="divide-y divide-secondary/30">
              {children}
            </div>
          ) : (
            <div className="p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto text-muted-foreground/30">
                <HugeiconsIcon icon={Tick01Icon} size={24} />
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 italic">
                All caught up!
              </p>
            </div>
          )}
        </ScrollArea>

        <Link
          href={footerLinkHref}
          className="block p-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/10 hover:text-primary transition-all border-t border-secondary"
          onClick={() => setIsOpen(false)}
        >
          {footerLinkLabel}
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="inline-block ml-1" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
