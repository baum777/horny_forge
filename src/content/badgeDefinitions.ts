export type BadgeRarity = 'Common' | 'Rare' | 'Epic';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  icon: string;
  unlockCondition: string;
}

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'quiz-complete',
    name: 'Desire Scanned',
    description: 'Completed the Horny Level Quiz and discovered your true class.',
    rarity: 'Common',
    icon: '🔮',
    unlockCondition: 'Complete the quiz',
  },
  {
    id: 'all-sections',
    name: 'Deep Explorer',
    description: 'Ventured through every section of the Horny Meta Universe.',
    rarity: 'Rare',
    icon: '🗺️',
    unlockCondition: 'Visit all sections',
  },
  {
    id: 'meme-forged',
    name: 'Meme Alchemist',
    description: 'Forged your first meme in the legendary Meme Forge.',
    rarity: 'Common',
    icon: '🎨',
    unlockCondition: 'Create a meme',
  },
  {
    id: 'time-spent',
    name: 'Addicted',
    description: 'Spent 90+ seconds in the Horny Meta. The desire is real.',
    rarity: 'Rare',
    icon: '⏰',
    unlockCondition: 'Spend 90 seconds on site',
  },
  {
    id: 'first-share',
    name: 'Prophet',
    description: 'Spread the word by sharing your first Horny content.',
    rarity: 'Common',
    icon: '📢',
    unlockCondition: 'Share any content',
  },
  {
    id: 'meta-demon',
    name: 'Meta Demon Class',
    description: 'Achieved the highest Horny Level classification.',
    rarity: 'Epic',
    icon: '👹',
    unlockCondition: 'Get Meta Demon in quiz',
  },
  {
    id: 'three-memes',
    name: 'Meme Lord',
    description: 'Created 3 memes in the Forge. Your creativity knows no bounds.',
    rarity: 'Rare',
    icon: '👑',
    unlockCondition: 'Create 3 memes',
  },
  {
    id: 'fomo-armed',
    name: 'Alert Sentinel',
    description: 'Armed a FOMO Alert. Always watching. Always ready.',
    rarity: 'Common',
    icon: '🔔',
    unlockCondition: 'Set a FOMO alert',
  },
  {
    id: 'full-meter',
    name: 'Maximum Horny',
    description: 'Reached 100% on the Horny Meter. Ultimate desire achieved.',
    rarity: 'Epic',
    icon: '🔥',
    unlockCondition: 'Fill the Horny Meter',
  },
];

export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return badgeDefinitions.find(b => b.id === id);
};

export const getBadgesByRarity = (rarity: BadgeRarity): BadgeDefinition[] => {
  return badgeDefinitions.filter(b => b.rarity === rarity);
};

export const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'Common':
      return 'text-gray-400';
    case 'Rare':
      return 'text-blue-400';
    case 'Epic':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
};

export const getRarityBorderColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'Common':
      return 'border-gray-500';
    case 'Rare':
      return 'border-blue-500';
    case 'Epic':
      return 'border-purple-500';
    default:
      return 'border-gray-500';
  }
};
