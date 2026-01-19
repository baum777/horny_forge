// localStorage helpers with type safety
import { clientGamificationEnabled } from '@/lib/gamificationFlags';

const STORAGE_KEYS = {
  USER: 'app_user',
  BADGES: 'app_badges',
  CONTENT_ITEMS: 'app_content_items',
  ENERGY_METER: 'app_energy_meter',
  VISIT_DATA: 'app_visit_data',
} as const;

const LEGACY_STORAGE_KEYS = {
  USER: 'horny_user',
  BADGES: 'horny_badges',
  CONTENT_ITEMS: 'horny_memes',
  ENERGY_METER: 'horny_meter',
  VISIT_DATA: 'horny_visit_data',
} as const;

export interface User {
  handle: string;
  avatar: string;
  joinedAt: string;
}

export interface Badge {
  id: string;
  unlockedAt: string | null;
}

export interface ContentItem {
  id: string;
  templateId: string;
  topText: string;
  bottomText: string;
  accentStyle: 'pink' | 'red' | 'gold';
  createdAt: string;
  imageData?: string;
}

export interface VisitData {
  firstVisit: string;
  totalTime: number;
  sectionsVisited: string[];
  scrollDepth: number;
}

// Generic helpers
function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function getItemWithLegacy<T>(key: string, legacyKey?: string): T | null {
  const current = getItem<T>(key);
  if (current !== null) return current;
  if (!legacyKey) return null;
  const legacy = getItem<T>(legacyKey);
  if (legacy !== null) {
    setItem(key, legacy);
  }
  return legacy;
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage error:', e);
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('localStorage error:', e);
  }
}

// User
export const getUser = () => getItemWithLegacy<User>(STORAGE_KEYS.USER, LEGACY_STORAGE_KEYS.USER);
export const setUser = (user: User) => setItem(STORAGE_KEYS.USER, user);
export const clearUser = () => removeItem(STORAGE_KEYS.USER);

// Badges
export const getBadges = () =>
  clientGamificationEnabled
    ? getItemWithLegacy<Record<string, Badge>>(STORAGE_KEYS.BADGES, LEGACY_STORAGE_KEYS.BADGES) || {}
    : {};
export const setBadges = (badges: Record<string, Badge>) => {
  if (!clientGamificationEnabled) return;
  setItem(STORAGE_KEYS.BADGES, badges);
};
export const unlockBadge = (id: string) => {
  if (!clientGamificationEnabled) return false;
  const badges = getBadges();
  if (!badges[id]?.unlockedAt) {
    badges[id] = { id, unlockedAt: new Date().toISOString() };
    setBadges(badges);
    return true;
  }
  return false;
};

// Content Items
export const getContentItems = () =>
  getItemWithLegacy<ContentItem[]>(STORAGE_KEYS.CONTENT_ITEMS, LEGACY_STORAGE_KEYS.CONTENT_ITEMS) || [];
export const addContentItem = (item: ContentItem) => {
  const items = getContentItems();
  items.unshift(item);
  // Keep only last 12
  setItem(STORAGE_KEYS.CONTENT_ITEMS, items.slice(0, 12));
};

// Energy Meter
export const getEnergyMeter = () =>
  clientGamificationEnabled
    ? getItemWithLegacy<number>(STORAGE_KEYS.ENERGY_METER, LEGACY_STORAGE_KEYS.ENERGY_METER) || 0
    : 0;
export const setEnergyMeter = (value: number) => {
  if (!clientGamificationEnabled) return;
  setItem(STORAGE_KEYS.ENERGY_METER, Math.min(100, Math.max(0, value)));
};
export const addToEnergyMeter = (amount: number) => {
  if (!clientGamificationEnabled) return 0;
  const current = getEnergyMeter();
  setEnergyMeter(current + amount);
  return Math.min(100, current + amount);
};

// Visit Data
export const getVisitData = (): VisitData => {
  const data = getItemWithLegacy<VisitData>(STORAGE_KEYS.VISIT_DATA, LEGACY_STORAGE_KEYS.VISIT_DATA);
  return data || {
    firstVisit: new Date().toISOString(),
    totalTime: 0,
    sectionsVisited: [],
    scrollDepth: 0,
  };
};
export const updateVisitData = (updates: Partial<VisitData>) => {
  const data = getVisitData();
  setItem(STORAGE_KEYS.VISIT_DATA, { ...data, ...updates });
};
export const addSectionVisited = (section: string) => {
  const data = getVisitData();
  if (!data.sectionsVisited.includes(section)) {
    data.sectionsVisited.push(section);
    setItem(STORAGE_KEYS.VISIT_DATA, data);
    return true;
  }
  return false;
};
