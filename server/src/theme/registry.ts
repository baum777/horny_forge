import fs from 'node:fs';
import path from 'node:path';

const THEMES_DIR = path.join(process.cwd(), 'themes');

let cachedThemeIds: string[] | null = null;

export function normalizeThemeId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function listThemeIds(): string[] {
  if (cachedThemeIds) return cachedThemeIds;
  try {
    cachedThemeIds = fs
      .readdirSync(THEMES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    cachedThemeIds = [];
  }
  return cachedThemeIds;
}

export function isThemeAvailable(themeId: string): boolean {
  const available = listThemeIds();
  return available.includes(themeId);
}

export function clearThemeRegistryCache(): void {
  cachedThemeIds = null;
}


