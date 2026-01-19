// Types for the Archives feature

export interface Artifact {
  id: string;
  image_url: string;
  caption: string;
  tags: string[];
  author_id: string;
  author_handle: string | null;
  author_avatar: string | null;
  created_at: string;
  votes_count: number;
  matrix_meta: Record<string, unknown>;
  scores: {
    novelty: number | null;
    coherence: number | null;
    risk: number | null;
  };
  author_level?: number | null;
  author_top_badge_id?: string | null;
}

export interface Vote {
  artifact_id: string;
  user_id: string;
  created_at: string;
}

export interface ArchivesUser {
  id: string;
  email?: string;
  handle: string;
  avatar: string | null;
}

export type SortOption = 'newest' | 'top24h' | 'topAll';

export const PREDEFINED_TAGS = [
  '#CroisHorney',
  '#EichHorney',
  '#PopHorney',
  '#CornyHorney',
  '#PixelHorney',
  '#ChromeHorney',
  '#UniHorney',
  '#WildHorney',
  '#BrainHorney',
  '#MetaHorney',
  '#CosmicHorney',
  '#ZenHorney',
  '#PumpHorney',
  '#BagHorney',
  '#SignalHorney',
  '#MoonHorney',
  '#GoldHorney',
] as const;

export type PredefinedTag = typeof PREDEFINED_TAGS[number];
