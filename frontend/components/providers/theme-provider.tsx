'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';

function ColorThemeSync() {
  const colorTheme = useAppStore((s) => s.colorTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      document.documentElement.setAttribute('data-color-theme', colorTheme);
    }
  }, [colorTheme, isHydrated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ColorThemeSync />
      {children}
    </NextThemeProvider>
  );
}
