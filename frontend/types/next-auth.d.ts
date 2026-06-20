import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: UserRole;
      /** Whether the user has been suspended. */
      suspended: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    suspended: boolean;
  }
}
