import React from 'react';

export const BASES = [
  {
    id: 'base-01',
    title: 'Core Head (Tight Brand)',
    description: 'Simple unicorn head neon sketch',
    image: '/bases/base-01-unicorn-head.png',
    unlockLevel: 1,
  },
  {
    id: 'base-02',
    title: 'Landscape (Lore Scene)',
    description: 'Unicorn landscape doodle',
    image: '/bases/base-02-landscape.png',
    unlockLevel: 2,
  },
  {
    id: 'base-03',
    title: 'Holy Ascension (Epic Meme)',
    description: 'Epic/meme scene example',
    image: '/bases/base-03-jesus-meme.png',
    unlockLevel: 3,
  },
  {
    id: 'base-04',
    title: 'Rocket (Meta Launch)',
    description: 'Rocket meme example',
    image: '/bases/base-04-rocket.png',
    unlockLevel: 5,
  },
] as const;

export type BaseId = typeof BASES[number]['id'];

interface BasePickerProps {
  selectedBaseId: BaseId | null;
  onSelect: (id: BaseId) => void;
  userLevel: number;
}

export const BasePicker: React.FC<BasePickerProps> = ({ selectedBaseId, onSelect, userLevel }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">Choose Base</label>
      <div className="grid grid-cols-2 gap-3">
        {BASES.map((base) => {
          const isLocked = userLevel < base.unlockLevel;
          return (
            <button
              key={base.id}
              onClick={() => {
                if (!isLocked) onSelect(base.id);
              }}
              disabled={isLocked}
              title={isLocked ? `Unlock at Level ${base.unlockLevel}` : base.title}
              className={`relative p-2 rounded-lg text-left transition-all border-2 overflow-hidden group ${
                selectedBaseId === base.id && !isLocked
                  ? 'border-transparent'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {selectedBaseId === base.id && !isLocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 animate-gradient-x -z-10" />
              )}
              <div className={`p-2 rounded-md h-full bg-background/90 ${selectedBaseId === base.id && !isLocked ? 'backdrop-blur-sm' : ''}`}>
                <div className="aspect-square rounded-md mb-2 overflow-hidden bg-black border border-white/10 relative">
                  <img
                    src={base.image}
                    alt={base.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/000000/FFFFFF?text=' + base.id;
                    }}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] uppercase tracking-widest text-primary">
                      Unlock at Level {base.unlockLevel}
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-bold leading-tight truncate">{base.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                  {base.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
