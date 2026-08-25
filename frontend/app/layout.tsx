import LoginModal from "@/components/auth/LoginModal";
import OnBoarding from "@/components/auth/OnBoarding";
import ChatFAB from "@/components/chat/layout/ChatFAB";
import FloatingChat from "@/components/chat/layout/FloatingChat";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import SidebarWrapper from "@/components/layout/SidebarWrapper";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Providers } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Figtree, Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import SidebarSkeleton from "@/components/skeletons/layout/SidebarSkeleton";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  title: {
    default: "informnt · Geopolitical Intelligence & News Monitor",
    template: "%s | informnt",
  },
  description:
    "Multi-perspective geopolitical intelligence platform with AI-powered surveillance, bias detection, and story clustering.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon",
  },
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
      data-color-theme="maia"
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script: sync theme and data-color-theme from localStorage before first paint */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var isDark=t==='dark'||(!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(isDark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}var d=JSON.parse(localStorage.getItem('global-news-aggregator-settings'));if(d&&d.state&&d.state.colorTheme){document.documentElement.setAttribute('data-color-theme',d.state.colorTheme);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-background text-foreground">
        <AuthProvider>
          <Providers>
            <TooltipProvider>
              <div className="flex flex-col h-screen">
                {/* 100% Static Shell Header */}
                <Navbar />

                <main className="flex flex-1 overflow-hidden">
                  {/* Granular Sidebar Suspense */}
                  <Suspense fallback={<SidebarSkeleton />}>
                    <SidebarWrapper>
                      <Sidebar />
                    </SidebarWrapper>
                  </Suspense>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    <div className="flex-1 min-h-0">{children}</div>
                    {/*<Footer />*/}
                  </div>
                </main>
              </div>

              {/* Global chat sidebar — available on every page */}
              <Suspense fallback={null}>
                <ChatFAB />
                <FloatingChat />
              </Suspense>

              <Suspense fallback={null}>
                <LoginModal />
                <OnBoarding />
              </Suspense>

              <Toaster />
              <Analytics />
              <SpeedInsights />
            </TooltipProvider>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
