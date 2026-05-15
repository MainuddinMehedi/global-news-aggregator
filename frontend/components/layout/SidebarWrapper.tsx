"use client";

import { useIsSidebarCollapsed } from "@/store";
import { cn } from "@/lib/utils";

export default function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isCollapsed = useIsSidebarCollapsed();

  return (
    <div
      className={cn(
        "hidden md:flex shrink-0 border-r border-border overflow-y-auto transition-all duration-300",
        isCollapsed ? "w-14" : "w-14 lg:w-56",
      )}
    >
      {children}
    </div>
  );
}
