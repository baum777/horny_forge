"use client";

import Image from 'next/image';
import { Lock } from 'lucide-react';
import { getBaseUnlockLevel } from '@/lib/gamification/badgeRules';
import { useUserStats } from '@/lib/hooks/useUserStats';
import type { BaseId } from '@/lib/forge/promptEngine';

export const BASES = [
  {
    id: 'base-01' as BaseId,
    title: 'Core Head (Tight Brand)',
    description: 'Simple unicorn head neon sketch',
    image: '/bases/base-01-unicorn-head.png',
  },
  {
    id: 'base-02' as BaseId,
    title: 'Landscape (Lore Scene)',
    description: 'Unicorn landscape doodle',
    image: '/bases/base-02-landscape.png',
  },
  {
    id: 'base-03' as BaseId,
    title: 'Holy Ascension (Epic Meme)',
    description: 'Epic/meme scene example',
    image: '/bases/base-03-jesus-meme.png',
  },
  {
    id: 'base-04' as BaseId,
    title: 'Rocket (Meta Launch)',
    description: 'Rocket meme example',
    image: '/bases/base-04-rocket.png',
  },
] as const;

interface BasePickerProps {
  selectedBaseId: BaseId | null;
  onSelect: (id: BaseId) => void;
}

export function BasePicker({ selectedBaseId, onSelect }: BasePickerProps) {
  const { stats } = useUserStats();
  const userLevel = stats?.level ?? 1;

  const isBaseLocked = (baseId: BaseId): boolean => {
    const unlockLevel = getBaseUnlockLevel(baseId);
    return unlockLevel !== null && unlockLevel > userLevel;
  };

  const handleSelect = (baseId: BaseId) => {
    if (isBaseLocked(baseId)) {
      return; // Don't allow selection of locked bases
    }
    onSelect(baseId);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">Choose Base</label>
      <div className="grid grid-cols-2 gap-3">
        {BASES.map((base) => {
          const locked = isBaseLocked(base.id);
          const unlockLevel = getBaseUnlockLevel(base.id);
          
          return (
            <button
              key={base.id}
              onClick={() => handleSelect(base.id)}
              disabled={locked}
              className={`relative p-2 rounded-lg text-left transition-all border-2 overflow-hidden group ${
                locked
                  ? 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
                  : selectedBaseId === base.id
                  ? 'border-primary shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className={`p-2 rounded-md h-full bg-background/90 ${selectedBaseId === base.id ? 'backdrop-blur-sm' : ''}`}>
                <div className="aspect-square rounded-md mb-2 overflow-hidden bg-black border border-white/10 relative">
                  <Image
                    src={base.image}
                    alt={base.title}
                    width={200}
                    height={200}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      locked ? '' : 'group-hover:scale-110'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/000000/FFFFFF?text=' + base.id;
                    }}
                  />
                  {locked && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-[10px] font-bold">Level {unlockLevel}</p>
                      </div>
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-bold leading-tight truncate flex items-center gap-1">
                  {locked && <Lock className="w-3 h-3" />}
                  {base.title}
                </h4>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                  {base.description}
                </p>
                {locked && unlockLevel && (
                  <p className="text-[9px] text-primary mt-1 font-semibold">
                    Unlock at Level {unlockLevel}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

