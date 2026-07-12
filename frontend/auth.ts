import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { sendVerificationRequest } from "@/lib/auth/magicLink";

const adapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...adapter,
    createUser: async (user) => {
      // Use a single transaction to prevent race conditions and null-reference errors
      return await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            ...user,
            settings: { onboarded: false },
          },
        });

        // Guaranteed provisioning of default notification preferences
        await tx.notificationPreference.create({
          data: {
            userId: createdUser.id,
            inAppEnabled: true,
            discordEnabled: false,
            telegramEnabled: false,
            digestEnabled: false,
          },
        });

        return createdUser as any;
      });
    },
  },
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER || "smtp://localhost:2525",
      from: process.env.EMAIL_FROM || "no-reply@example.com",
      sendVerificationRequest,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { suspended: true },
        });
        if (dbUser?.suspended) {
          return false; // Block sign-in for suspended accounts
        }
      }

      // Sync Google profile picture to the database if the user doesn't have an image
      if (account?.provider === "google" && profile?.picture && !user.image) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { image: profile.picture },
          });
          user.image = profile.picture; // update the object in memory for the current session
        } catch (error) {
          console.error("Failed to update user image:", error);
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.suspended = user.suspended;
      }
      return session;
    },
  },
});
