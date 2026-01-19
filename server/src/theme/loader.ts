import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ThemeConfig, ThemeAssets } from './types';
import { assertThemeCopy, assertThemeTokensFile } from './validate';
import { isThemeAvailable, listThemeIds, normalizeThemeId } from './registry';

type ThemeLoadOptions = {
  themeId: string;
  fallbackThemeId: string;
  language?: string;
  assetsBaseUrl: string;
  enableCache: boolean;
};

type ThemeLoadResult = {
  config: ThemeConfig;
  etag: string;
};

const THEMES_DIR = path.join(process.cwd(), 'themes');
const configCache = new Map<string, ThemeLoadResult>();

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const readJsonFile = (filePath: string): unknown => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const findCopyFile = (themeId: string, language?: string): string | null => {
  const baseDir = path.join(THEMES_DIR, themeId);
  const lang = language ? language.toLowerCase().split(',')[0]?.split('-')[0] : undefined;
  const candidates = [
    ...(lang ? [`copy.${lang}.json`] : []),
    'copy.de.json',
    'copy.en.json',
  ];

  for (const file of candidates) {
    const fullPath = path.join(baseDir, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  try {
    const files = fs.readdirSync(baseDir).filter((file) => file.startsWith('copy.') && file.endsWith('.json'));
    const fallback = files[0];
    return fallback ? path.join(baseDir, fallback) : null;
  } catch {
    return null;
  }
};

const buildAssets = (themeId: string, assets: Record<string, string>, assetsBaseUrl: string): ThemeAssets => {
  const baseUrl = `${normalizeBaseUrl(assetsBaseUrl)}/${themeId}/assets`;
  const resolved: any = { baseUrl };
  for (const [key, value] of Object.entries(assets)) {
    resolved[key] = `${baseUrl}/${value}`;
  }
  return resolved as ThemeAssets;
};

const createEtag = (payload: object): string => {
  const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `"${hash}"`;
};

export function loadThemeConfig(options: ThemeLoadOptions): ThemeLoadResult {
  const normalizedThemeId = normalizeThemeId(options.themeId);
  const normalizedFallback = normalizeThemeId(options.fallbackThemeId) || 'default';
  const resolvedThemeId = isThemeAvailable(normalizedThemeId) ? normalizedThemeId : normalizedFallback;
  const requestedLang = options.language ? options.language.toLowerCase() : undefined;
  const cacheKey = `${resolvedThemeId}:${requestedLang ?? 'default'}:${options.assetsBaseUrl}`;

  if (options.enableCache && configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  if (!isThemeAvailable(resolvedThemeId)) {
    const knownThemes = listThemeIds();
    throw new Error(`Theme "${resolvedThemeId}" not found. Available: ${knownThemes.join(', ')}`);
  }

  const themeDir = path.join(THEMES_DIR, resolvedThemeId);
  const tokensPath = path.join(themeDir, 'tokens.json');
  const copyPath = findCopyFile(resolvedThemeId, requestedLang);

  if (!fs.existsSync(tokensPath)) {
    throw new Error(`Missing tokens.json for theme "${resolvedThemeId}"`);
  }
  if (!copyPath) {
    throw new Error(`Missing copy.<lang>.json for theme "${resolvedThemeId}"`);
  }

  const tokensFile = assertThemeTokensFile(readJsonFile(tokensPath));
  const copy = assertThemeCopy(readJsonFile(copyPath));
  const assets = buildAssets(resolvedThemeId, tokensFile.assets, options.assetsBaseUrl);

  const config: ThemeConfig = {
    themeId: tokensFile.themeId,
    displayName: tokensFile.displayName,
    tokens: tokensFile.tokens,
    copy,
    assets,
  };

  const etag = createEtag(config);
  const result = { config, etag };

  if (options.enableCache) {
    configCache.set(cacheKey, result);
  }

  return result;
}

