"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Globe, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import NavLinks from "./NavLinks";

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <HugeiconsIcon icon={Menu01Icon} className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-56! p-0 bg-sidebar border-r border-sidebar-border text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        <div className="flex flex-col h-full py-5 px-3">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-1 mb-6"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shrink-0">
              <HugeiconsIcon
                icon={Globe}
                className="w-5 h-5 text-primary-foreground"
              />
            </div>
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
              GlobalAgg<span className="text-primary">.</span>
            </span>
          </Link>

          <NavLinks alwaysFull onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
