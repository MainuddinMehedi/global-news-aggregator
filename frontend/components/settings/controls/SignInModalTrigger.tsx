"use client";

import { Button } from "@/components/ui/button";
import { useSetLoginModalOpen } from "@/store";

interface SignInModalTriggerProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export default function SignInModalTrigger({
  className,
  size = "sm",
  children = "Sign In",
}: SignInModalTriggerProps) {
  const setLoginModalOpen = useSetLoginModalOpen();

  return (
    <Button
      size={size}
      className={className}
      onClick={() => setLoginModalOpen(true)}
    >
      {children}
    </Button>
  );
}
