import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Simple in-memory rate limiter for Magic Links (resets every hour or on server restart)
const emailRateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 requests
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest(params) {
        const { identifier, url, provider, theme } = params;
        
        // Rate Limiting Logic
        const now = Date.now();
        const userLimit = emailRateLimit.get(identifier);
        
        if (userLimit) {
          if (now - userLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
            if (userLimit.count >= RATE_LIMIT_MAX) {
              console.warn(`Rate limit exceeded for email: ${identifier}`);
              // We return silently to provide a generic success message
              // avoiding enumeration attacks
              return;
            }
            userLimit.count += 1;
          } else {
            // Reset window
            emailRateLimit.set(identifier, { count: 1, timestamp: now });
          }
        } else {
          emailRateLimit.set(identifier, { count: 1, timestamp: now });
        }

        // Send the email using the default NextAuth Nodemailer implementation
        const { host } = new URL(url);
        const transport = (await import("nodemailer")).createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to ${host}`,
          text: `Sign in to ${host}\n${url}\n\n`,
          html: `<body style="background: #f9f9f9; padding: 20px; font-family: sans-serif;">
            <div style="background: white; border-radius: 10px; padding: 20px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Sign in to ${host}</h2>
              <p style="color: #555;">Click the button below to sign in securely. The link is valid for 24 hours.</p>
              <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Sign in</a>
            </div>
          </body>`,
        });
        
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email (${failed.join(", ")}) could not be sent`);
        }
      }
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
