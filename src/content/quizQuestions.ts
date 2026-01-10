export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    id: 'A' | 'B' | 'C';
    text: string;
    points: number;
  }[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "It's 3 AM. The chart just woke you up. You...",
    options: [
      { id: 'A', text: 'Check X for alpha, panic anyway', points: 1 },
      { id: 'B', text: 'Zoom out, light a candle, chant "WAGMI"', points: 2 },
      { id: 'C', text: 'Already have 47 tabs open and buying the dip', points: 3 },
    ],
  },
  {
    id: 2,
    question: "Your ideal relationship with $HORNY is...",
    options: [
      { id: 'A', text: 'Casual observer. Might ape in if it 10x', points: 1 },
      { id: 'B', text: 'Diamond hands. Bought once, never selling', points: 2 },
      { id: 'C', text: 'Full degen. Already got a $HORNY tattoo', points: 3 },
    ],
  },
  {
    id: 3,
    question: "When you see a red candle, you feel...",
    options: [
      { id: 'A', text: 'Fear. Pure, unfiltered fear', points: 1 },
      { id: 'B', text: 'Nothing. My soul left long ago', points: 2 },
      { id: 'C', text: 'Excitement. Time to accumulate more', points: 3 },
    ],
  },
  {
    id: 4,
    question: "Your portfolio strategy is best described as...",
    options: [
      { id: 'A', text: '90% stables, 10% "fun money"', points: 1 },
      { id: 'B', text: 'Diversified across 50 shitcoins', points: 2 },
      { id: 'C', text: 'All in. One coin. Maximum conviction', points: 3 },
    ],
  },
  {
    id: 5,
    question: "How do you consume crypto news?",
    options: [
      { id: 'A', text: 'Weekly newsletter, stay informed but chill', points: 1 },
      { id: 'B', text: 'X feed running 24/7, TG alerts on', points: 2 },
      { id: 'C', text: 'I AM the news. My posts move markets', points: 3 },
    ],
  },
  {
    id: 6,
    question: "When a coin you hold pumps 5x overnight...",
    options: [
      { id: 'A', text: 'Take profits, be responsible', points: 1 },
      { id: 'B', text: 'Sell half, let the rest ride', points: 2 },
      { id: 'C', text: "5x? That's the STARTING point", points: 3 },
    ],
  },
  {
    id: 7,
    question: "Your final form in the Horny Meta is...",
    options: [
      { id: 'A', text: 'A humble observer of the madness', points: 1 },
      { id: 'B', text: 'A seasoned warrior of the charts', points: 2 },
      { id: 'C', text: 'A godlike entity of pure market energy', points: 3 },
    ],
  },
];

export interface QuizClass {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  action: string;
}

export const quizClasses: QuizClass[] = [
  {
    id: 'beta-horny',
    name: 'Beta Horny',
    minScore: 7,
    maxScore: 9,
    description: 'You observe from the sidelines. The charts whisper but you hesitate. Your journey has just begun.',
    action: 'Start small. Watch. Learn. The meta will reveal itself.',
  },
  {
    id: 'chart-goblin',
    name: 'Chart Goblin',
    minScore: 10,
    maxScore: 12,
    description: 'You lurk in the shadows of every candle. Not quite degen, but the desire grows stronger.',
    action: 'Trust your instincts more. The goblin knows things.',
  },
  {
    id: 'signal-addict',
    name: 'Signal Addict',
    minScore: 13,
    maxScore: 15,
    description: 'Every notification is a hit. Every pump is a rush. You crave the dopamine of green candles.',
    action: 'Channel this energy. Join the ritual. Post your conviction.',
  },
  {
    id: 'unicorn-rider',
    name: 'Unicorn Rider',
    minScore: 16,
    maxScore: 17,
    description: 'You have mounted the mythical beast. When others panic, you see opportunity.',
    action: 'Lead others. Your conviction is contagious.',
  },
  {
    id: 'parabolic-prophet',
    name: 'Parabolic Prophet',
    minScore: 18,
    maxScore: 19,
    description: 'You sense the pumps before they happen. The charts speak to you in dreams.',
    action: 'Share your visions. The community needs your wisdom.',
  },
  {
    id: 'meta-demon',
    name: 'Meta Demon',
    minScore: 20,
    maxScore: 21,
    description: 'Maximum horny achieved. You have transcended mortal chart-watching. You ARE the market.',
    action: 'Ascend. Create. The meta bends to your will.',
  },
];

export function getQuizClass(score: number): QuizClass {
  const cls = quizClasses.find(c => score >= c.minScore && score <= c.maxScore);
  return cls || quizClasses[0];
}

export function getHornyLevel(score: number): number {
  // Convert 7-21 score to 0-100 percentage
  return Math.round(((score - 7) / 14) * 100);
}
