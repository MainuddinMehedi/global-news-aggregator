import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { RightPanel } from "@/components/layout/RightPanel";
import { ArticleDetailModal } from "@/components/articles/ArticleDetailModal";
import { ChatSlideOver } from "@/components/chat/ChatSlideOver";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GlobalAgg — Geopolitical News Aggregator",
  description:
    "Multi-perspective geopolitical news aggregation with AI-powered bias detection and analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="overflow-hidden">
        <Providers>
          <TooltipProvider>
            <div className="flex h-screen w-full">
              <Sidebar />
              <main className="flex-1 flex flex-col min-w-0 bg-background relative">
                <TopHeader />
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {children}
                </div>
              </main>
              <RightPanel />
            </div>
            <ArticleDetailModal />
            <ChatSlideOver />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
