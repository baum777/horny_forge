// localStorage helpers with type safety

const STORAGE_KEYS = {
  USER: 'horny_user',
  BADGES: 'horny_badges',
  QUIZ_RESULT: 'horny_quiz_result',
  MEMES: 'horny_memes',
  FOMO_ALERT: 'horny_fomo_alert',
  HORNY_METER: 'horny_meter',
  VISIT_DATA: 'horny_visit_data',
} as const;

export interface User {
  handle: string;
  avatar: string;
  joinedAt: string;
}

export interface QuizResult {
  class: string;
  level: number;
  completedAt: string;
}

export interface Badge {
  id: string;
  unlockedAt: string | null;
}

export interface Meme {
  id: string;
  templateId: string;
  topText: string;
  bottomText: string;
  accentStyle: 'pink' | 'red' | 'gold';
  createdAt: string;
  imageData?: string;
}

export interface FOMOAlert {
  threshold: number;
  direction: 'up' | 'down';
  armed: boolean;
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
export const getUser = () => getItem<User>(STORAGE_KEYS.USER);
export const setUser = (user: User) => setItem(STORAGE_KEYS.USER, user);
export const clearUser = () => removeItem(STORAGE_KEYS.USER);

// Quiz
export const getQuizResult = () => getItem<QuizResult>(STORAGE_KEYS.QUIZ_RESULT);
export const setQuizResult = (result: QuizResult) => setItem(STORAGE_KEYS.QUIZ_RESULT, result);

// Badges
export const getBadges = () => getItem<Record<string, Badge>>(STORAGE_KEYS.BADGES) || {};
export const setBadges = (badges: Record<string, Badge>) => setItem(STORAGE_KEYS.BADGES, badges);
export const unlockBadge = (id: string) => {
  const badges = getBadges();
  if (!badges[id]?.unlockedAt) {
    badges[id] = { id, unlockedAt: new Date().toISOString() };
    setBadges(badges);
    return true;
  }
  return false;
};

// Memes
export const getMemes = () => getItem<Meme[]>(STORAGE_KEYS.MEMES) || [];
export const addMeme = (meme: Meme) => {
  const memes = getMemes();
  memes.unshift(meme);
  // Keep only last 12
  setItem(STORAGE_KEYS.MEMES, memes.slice(0, 12));
};

// FOMO Alert
export const getFOMOAlert = () => getItem<FOMOAlert>(STORAGE_KEYS.FOMO_ALERT);
export const setFOMOAlert = (alert: FOMOAlert) => setItem(STORAGE_KEYS.FOMO_ALERT, alert);
export const clearFOMOAlert = () => removeItem(STORAGE_KEYS.FOMO_ALERT);

// Horny Meter
export const getHornyMeter = () => getItem<number>(STORAGE_KEYS.HORNY_METER) || 0;
export const setHornyMeter = (value: number) => setItem(STORAGE_KEYS.HORNY_METER, Math.min(100, Math.max(0, value)));
export const addToHornyMeter = (amount: number) => {
  const current = getHornyMeter();
  setHornyMeter(current + amount);
  return Math.min(100, current + amount);
};

// Visit Data
export const getVisitData = (): VisitData => {
  const data = getItem<VisitData>(STORAGE_KEYS.VISIT_DATA);
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
