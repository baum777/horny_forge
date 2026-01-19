import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ThemeAssets, ThemeConfig, ThemeCopy, ThemeTokens } from '@/lib/theme/types';
import { defaultThemeTokens } from '@/lib/theme/default';
import { generateThemeVars } from '@/lib/theme/utils';

type ThemeContextType = {
  themeId: string;
  setThemeId: (themeId: string) => void;
  tokens: ThemeTokens;
  copy: ThemeCopy;
  assets: ThemeAssets;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const fallbackAssets: ThemeAssets = {
  baseUrl: '/themes/default/assets',
  logo: '/themes/default/assets/logo.svg',
  ogImage: '/themes/default/assets/og-image.svg',
  placeholderCard: '/themes/default/assets/placeholder-card.svg',
  socialDex: '/themes/default/assets/social-dex.svg',
  socialX: '/themes/default/assets/social-x.svg',
  socialDiscord: '/themes/default/assets/social-discord.svg',
};

const resolveInitialThemeId = () => {
  if (typeof window === 'undefined') return 'current';
  const url = new URL(window.location.href);
  const queryTheme = url.searchParams.get('theme');
  if (queryTheme) return queryTheme;
  const routeMatch = url.pathname.match(/^\/t\/([^/]+)(\/|$)/);
  if (routeMatch) return routeMatch[1];
  return 'current';
};

const fetchThemeConfig = async (themeId: string): Promise<ThemeConfig> => {
  const response = await fetch(`/themes/${themeId}/config`);
  if (!response.ok) {
    throw new Error(`Theme config unavailable: ${response.status}`);
  }
  return response.json();
};

const setMetaTag = (attribute: 'name' | 'property', key: string, content?: string) => {
  if (!content) return;
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

export function ThemeProvider({
  children,
  initialThemeId,
}: {
  children: React.ReactNode;
  initialThemeId?: string;
}) {
  const [themeId, setThemeId] = useState<string>(initialThemeId ?? resolveInitialThemeId());
  const { data, isLoading } = useQuery({
    queryKey: ['theme-config', themeId],
    queryFn: () => fetchThemeConfig(themeId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const tokens = data?.tokens ?? defaultThemeTokens;
  const copy = data?.copy ?? {};
  const assets = data?.assets ?? fallbackAssets;

  const themeVars = useMemo(() => generateThemeVars(tokens), [tokens]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', data?.themeId ?? 'default');
  }, [data?.themeId, themeVars]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const title = copy['meta.title'];
    const description = copy['meta.description'];
    const ogImage = assets.ogImage;

    if (title) {
      document.title = title;
      setMetaTag('property', 'og:title', title);
      setMetaTag('name', 'twitter:title', title);
    }
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage);
      setMetaTag('name', 'twitter:image', ogImage);
    }
  }, [assets.ogImage, copy]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, tokens, copy, assets, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

