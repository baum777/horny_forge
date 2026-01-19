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
  nameKey: string;
  descriptionKey: string;
  visual_type: string;
  rarity: 'common' | 'rare' | 'epic';
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    badge_id: 'SIGIL_FIRST_INFUSION',
    nameKey: 'profile.badges.sigils.firstInfusion.name',
    descriptionKey: 'profile.badges.sigils.firstInfusion.description',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'SIGIL_FIRST_RELEASE',
    nameKey: 'profile.badges.sigils.firstRelease.name',
    descriptionKey: 'profile.badges.sigils.firstRelease.description',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'SIGIL_FIRST_VOTE',
    nameKey: 'profile.badges.sigils.firstVote.name',
    descriptionKey: 'profile.badges.sigils.firstVote.description',
    visual_type: 'sigil',
    rarity: 'common',
  },
  {
    badge_id: 'STAMP_TREND_SPARK',
    nameKey: 'profile.badges.stamps.trendSpark.name',
    descriptionKey: 'profile.badges.stamps.trendSpark.description',
    visual_type: 'stamp',
    rarity: 'rare',
  },
  {
    badge_id: 'STAMP_FEED_DOMINATOR',
    nameKey: 'profile.badges.stamps.feedDominator.name',
    descriptionKey: 'profile.badges.stamps.feedDominator.description',
    visual_type: 'stamp',
    rarity: 'epic',
  },
  {
    badge_id: 'FRAGMENT_RETURN_2D',
    nameKey: 'profile.badges.fragments.return2d.name',
    descriptionKey: 'profile.badges.fragments.return2d.description',
    visual_type: 'fragment',
    rarity: 'common',
  },
  {
    badge_id: 'FRAGMENT_RETURN_7D',
    nameKey: 'profile.badges.fragments.return7d.name',
    descriptionKey: 'profile.badges.fragments.return7d.description',
    visual_type: 'fragment',
    rarity: 'rare',
  },
  {
    badge_id: 'OBJECT_CROISHORNEY',
    nameKey: 'profile.badges.objects.objectOne.name',
    descriptionKey: 'profile.badges.objects.objectOne.description',
    visual_type: 'object',
    rarity: 'common',
  },
  {
    badge_id: 'OBJECT_EICHHORNEY',
    nameKey: 'profile.badges.objects.objectTwo.name',
    descriptionKey: 'profile.badges.objects.objectTwo.description',
    visual_type: 'object',
    rarity: 'common',
  },
  {
    badge_id: 'OBJECT_BRAINHORNEY',
    nameKey: 'profile.badges.objects.objectThree.name',
    descriptionKey: 'profile.badges.objects.objectThree.description',
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
