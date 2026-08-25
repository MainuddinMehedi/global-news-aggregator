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
        {/* Blocking script: sync data-color-theme from localStorage before first paint */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=JSON.parse(localStorage.getItem('global-news-aggregator-settings'));if(d&&d.state&&d.state.colorTheme){document.documentElement.setAttribute('data-color-theme',d.state.colorTheme)}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-background text-foreground">
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <AuthProvider>
            <Providers>
              <TooltipProvider>
                <div className="flex flex-col h-screen">
                  <Navbar />

                  <main className="flex flex-1 overflow-hidden">
                    <SidebarWrapper>
                      <Suspense
                        fallback={
                          <div className="w-full h-full bg-card/20 animate-pulse" />
                        }
                      >
                        <Sidebar />
                      </Suspense>
                    </SidebarWrapper>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                      <div className="flex-1 min-h-0">{children}</div>
                      {/*<Footer />*/}
                    </div>
                  </main>
                </div>
              </TooltipProvider>

              {/* Global chat sidebar — available on every page */}
              {/* Since these are not using anything like searchParam or cockies that breaks static rendering, the use of suspense is not required here. */}
              <ChatFAB />
              <FloatingChat />

              <LoginModal />
              <Suspense fallback={null}>
                <OnBoarding />
              </Suspense>

              <Toaster />
              <Analytics />
              <SpeedInsights />
            </Providers>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
