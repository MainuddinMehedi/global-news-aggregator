import { Providers } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Figtree, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import FeedSkeleton from "@/components/Feed/FeedSkeleton";
import ChatFAB from "@/components/chat/ChatFAB";
import ChatSidebar from "@/components/chat/ChatSidebar";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Global News Aggregator",
  description:
    "Multi-perspective global news aggregation with AI-powered bias detection and analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        figtree.variable,
        inter.variable,
        jetbrainsMono.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground">
        <Providers>
          <TooltipProvider>
            <div className="flex flex-col h-screen">
              <Navbar />

              <main className="flex flex-1 overflow-hidden">
                <SidebarWrapper>
                  <Sidebar />
                </SidebarWrapper>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                  <Suspense fallback={<FeedSkeleton />}>
                    <div className="flex-1 min-h-0">{children}</div>
                  </Suspense>
                  {/*<Footer />*/}
                </div>
              </main>
            </div>
          </TooltipProvider>

          {/* Global chat sidebar — available on every page */}
          <Suspense fallback={null}>
            <ChatFAB />
            <ChatSidebar />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
