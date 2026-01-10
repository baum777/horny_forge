export interface MemeTemplate {
  id: string;
  name: string;
  preview: string; // Emoji or simple visual indicator
  description: string;
}

export const memeTemplates: MemeTemplate[] = [
  {
    id: 'unicorn',
    name: 'Unicorn Pump',
    preview: '🦄',
    description: 'Mythical gains await',
  },
  {
    id: 'chart',
    name: 'Chart Analysis',
    preview: '📈',
    description: 'Technical horny mode',
  },
  {
    id: 'ai-brain',
    name: 'AI Brain',
    preview: '🧠',
    description: 'Meta intelligence vibes',
  },
  {
    id: 'rocket',
    name: 'To The Moon',
    preview: '🚀',
    description: 'Classic degen energy',
  },
  {
    id: 'moon',
    name: 'Moonlight',
    preview: '🌙',
    description: 'Night trading aesthetic',
  },
  {
    id: 'diamond',
    name: 'Diamond Hands',
    preview: '💎',
    description: 'Never selling. Ever.',
  },
];

export const accentStyles = [
  { id: 'pink', name: 'Horny Pink', color: '#FF69B4' },
  { id: 'red', name: 'Rage Red', color: '#FF0000' },
  { id: 'gold', name: 'Gains Gold', color: '#FFD700' },
] as const;

export type AccentStyle = typeof accentStyles[number]['id'];
