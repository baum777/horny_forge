export type BadgeId =
  | 'SIGIL_FIRST_INFUSION'
  | 'SIGIL_FIRST_RELEASE'
  | 'SIGIL_FIRST_VOTE'
  | 'STAMP_TREND_SPARK'
  | 'STAMP_FEED_DOMINATOR'
  | 'FRAGMENT_RETURN_2D'
  | 'FRAGMENT_RETURN_7D'
  | 'OBJECT_CROISHORNEY'
  | 'OBJECT_EICHHORNEY'
  | 'OBJECT_BRAINHORNEY';

export type BadgeDefinition = {
  badge_id: BadgeId;
  name: string;
  description: string;
  visual_type: string;
  rarity: 'common' | 'rare' | 'epic';
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    badge_id: 'SIGIL_FIRST_INFUSION',
    name: 'First Infusion',
    description: 'Forged your first artifact in the Meta Forge.',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'SIGIL_FIRST_RELEASE',
    name: 'First Release',
    description: 'Released your first artifact into the Archives.',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'SIGIL_FIRST_VOTE',
    name: 'First Vote',
    description: 'Cast your first vote of desire.',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'STAMP_TREND_SPARK',
    name: 'Trend Spark',
    description: 'An artifact reached 10 votes.',
    visual_type: 'stamp',
    rarity: 'rare',
  },
  {
    badge_id: 'STAMP_FEED_DOMINATOR',
    name: 'Feed Dominator',
    description: 'An artifact reached 25 votes.',
    visual_type: 'stamp',
    rarity: 'epic',
  },
  {
    badge_id: 'FRAGMENT_RETURN_2D',
    name: 'Return Fragment',
    description: 'Returned to the Archives two days in a row.',
    visual_type: 'fragment',
    rarity: 'common',
  },
  {
    badge_id: 'FRAGMENT_RETURN_7D',
    name: 'Return Relic',
    description: 'Maintained a seven-day return streak.',
    visual_type: 'fragment',
    rarity: 'rare',
  },
  {
    badge_id: 'OBJECT_CROISHORNEY',
    name: 'CroisHorney Object',
    description: 'Used #CroisHorney three times on releases.',
    visual_type: 'object',
    rarity: 'common',
  },
  {
    badge_id: 'OBJECT_EICHHORNEY',
    name: 'EichHorney Object',
    description: 'Used #EichHorney three times on releases.',
    visual_type: 'object',
    rarity: 'common',
  },
  {
    badge_id: 'OBJECT_BRAINHORNEY',
    name: 'BrainHorney Object',
    description: 'Used #BrainHorney three times on releases.',
    visual_type: 'object',
    rarity: 'common',
  },
];

export const BADGE_ICON_PATHS: Record<BadgeId, string> = {
  SIGIL_FIRST_INFUSION: '/badges/badge_SIGIL_FIRST_INFUSION.svg',
  SIGIL_FIRST_RELEASE: '/badges/badge_SIGIL_FIRST_RELEASE.svg',
  SIGIL_FIRST_VOTE: '/badges/badge_SIGIL_FIRST_VOTE.svg',
  STAMP_TREND_SPARK: '/badges/badge_STAMP_TREND_SPARK.svg',
  STAMP_FEED_DOMINATOR: '/badges/badge_STAMP_FEED_DOMINATOR.svg',
  FRAGMENT_RETURN_2D: '/badges/badge_FRAGMENT_RETURN_2D.svg',
  FRAGMENT_RETURN_7D: '/badges/badge_FRAGMENT_RETURN_7D.svg',
  OBJECT_CROISHORNEY: '/badges/badge_OBJECT_CROISHORNEY.svg',
  OBJECT_EICHHORNEY: '/badges/badge_OBJECT_EICHHORNEY.svg',
  OBJECT_BRAINHORNEY: '/badges/badge_OBJECT_BRAINHORNEY.svg',
};
