export type BadgeRarity = 'Common' | 'Rare' | 'Epic';

export interface BadgeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  rarity: BadgeRarity;
  icon: string;
  unlockConditionKey: string;
}

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'all-sections',
    nameKey: 'badges.items.allSections.name',
    descriptionKey: 'badges.items.allSections.description',
    rarity: 'Rare',
    icon: '🗺️',
    unlockConditionKey: 'badges.items.allSections.unlock',
  },
  {
    id: 'first-generated',
    nameKey: 'badges.items.firstGenerate.name',
    descriptionKey: 'badges.items.firstGenerate.description',
    rarity: 'Common',
    icon: '🎨',
    unlockConditionKey: 'badges.items.firstGenerate.unlock',
  },
  {
    id: 'time-spent',
    nameKey: 'badges.items.timeSpent.name',
    descriptionKey: 'badges.items.timeSpent.description',
    rarity: 'Rare',
    icon: '⏰',
    unlockConditionKey: 'badges.items.timeSpent.unlock',
  },
  {
    id: 'first-share',
    nameKey: 'badges.items.firstShare.name',
    descriptionKey: 'badges.items.firstShare.description',
    rarity: 'Common',
    icon: '📢',
    unlockConditionKey: 'badges.items.firstShare.unlock',
  },
  {
    id: 'three-generated',
    nameKey: 'badges.items.threeGenerations.name',
    descriptionKey: 'badges.items.threeGenerations.description',
    rarity: 'Rare',
    icon: '👑',
    unlockConditionKey: 'badges.items.threeGenerations.unlock',
  },
  {
    id: 'fomo-armed',
    nameKey: 'badges.items.alert.name',
    descriptionKey: 'badges.items.alert.description',
    rarity: 'Common',
    icon: '🔔',
    unlockConditionKey: 'badges.items.alert.unlock',
  },
  {
    id: 'full-meter',
    nameKey: 'badges.items.fullMeter.name',
    descriptionKey: 'badges.items.fullMeter.description',
    rarity: 'Epic',
    icon: '🔥',
    unlockConditionKey: 'badges.items.fullMeter.unlock',
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
