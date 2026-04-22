import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Global News Aggregator",
  description: "AI-powered, multi-perspective news aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
