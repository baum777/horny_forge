export type ThemeTokens = {
  brand: {
    primary: string;
    secondary: string;
    foreground: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  surface: {
    background: string;
    level1: string;
    level2: string;
    level3: string;
  };
  border: {
    subtle: string;
    accent: string;
  };
  effects: {
    glowSoft: string;
    glowStrong: string;
  };
  tailwind: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    radius: string;
  };
  sidebar: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    ring: string;
  };
};

export type ThemeTokensFile = {
  themeId: string;
  displayName: string;
  tokens: ThemeTokens;
  assets: Record<string, string>;
};

export type ThemeCopy = Record<string, string>;

export type ThemeAssets = Record<string, string> & {
  baseUrl: string;
};

export type ThemeConfig = {
  themeId: string;
  displayName: string;
  tokens: ThemeTokens;
  copy: ThemeCopy;
  assets: ThemeAssets;
};

