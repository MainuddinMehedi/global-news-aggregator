import { auth } from "@/auth";
import SignInModalTrigger from "@/components/settings/controls/SignInModalTrigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default async function ProfileSection() {
  const session = await auth();

  const getInitials = (name?: string | null, email?: string | null) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  if (!session?.user) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <Avatar className="w-16 h-16 border border-border/80">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <HugeiconsIcon icon={UserCircle02Icon} className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">Guest User</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to sync your preferences across devices
              </p>
            </div>
          </div>

          <SignInModalTrigger className="font-semibold shadow-md shrink-0 sm:ml-auto">
            Sign In
          </SignInModalTrigger>
        </div>
        <Separator />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage
            src={session.user.image || undefined}
            alt={session.user.name || "User"}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {getInitials(session.user.name, session.user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <h3 className="text-xl font-bold">
            {session.user.name || "Anonymous User"}
          </h3>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
      </div>

      <Separator />
    </>
  );
}
