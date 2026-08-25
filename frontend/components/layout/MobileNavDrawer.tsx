"use client";

import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
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
            <Logo size="sm" />
          </Link>

          <NavLinks alwaysFull onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
