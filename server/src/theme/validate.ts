import type { ThemeCopy, ThemeTokensFile } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');

const requireKeys = (obj: Record<string, unknown>, keys: string[], label: string) => {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(`Missing ${label}.${key}`);
    }
  }
};

export function assertThemeTokensFile(input: unknown): ThemeTokensFile {
  if (!isRecord(input)) {
    throw new Error('Theme tokens must be an object');
  }

  requireKeys(input, ['themeId', 'displayName', 'tokens', 'assets'], 'tokens');

  if (typeof input.themeId !== 'string' || input.themeId.length === 0) {
    throw new Error('tokens.themeId must be a non-empty string');
  }
  if (typeof input.displayName !== 'string' || input.displayName.length === 0) {
    throw new Error('tokens.displayName must be a non-empty string');
  }
  if (!isRecord(input.tokens)) {
    throw new Error('tokens.tokens must be an object');
  }
  if (!isStringRecord(input.assets)) {
    throw new Error('tokens.assets must be a string map');
  }

  const tokens = input.tokens as Record<string, unknown>;
  requireKeys(tokens, ['brand', 'text', 'surface', 'border', 'effects', 'tailwind', 'sidebar'], 'tokens');

  const group = (name: string, keys: string[]) => {
    const section = tokens[name];
    if (!isRecord(section)) {
      throw new Error(`tokens.${name} must be an object`);
    }
    requireKeys(section, keys, `tokens.${name}`);
    for (const key of keys) {
      if (typeof section[key] !== 'string') {
        throw new Error(`tokens.${name}.${key} must be a string`);
      }
    }
  };

  group('brand', ['primary', 'secondary', 'foreground']);
  group('text', ['primary', 'secondary']);
  group('surface', ['background', 'level1', 'level2', 'level3']);
  group('border', ['subtle', 'accent']);
  group('effects', ['glowSoft', 'glowStrong']);
  group('tailwind', [
    'background',
    'foreground',
    'card',
    'cardForeground',
    'popover',
    'popoverForeground',
    'primary',
    'primaryForeground',
    'secondary',
    'secondaryForeground',
    'muted',
    'mutedForeground',
    'accent',
    'accentForeground',
    'destructive',
    'destructiveForeground',
    'border',
    'input',
    'ring',
    'radius',
  ]);
  group('sidebar', [
    'background',
    'foreground',
    'primary',
    'primaryForeground',
    'accent',
    'accentForeground',
    'border',
    'ring',
  ]);

  return input as ThemeTokensFile;
}

export function assertThemeCopy(input: unknown): ThemeCopy {
  if (!isStringRecord(input)) {
    throw new Error('Theme copy must be a string map');
  }
  return input;
}


