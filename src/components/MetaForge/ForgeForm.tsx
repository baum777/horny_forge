import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PREDEFINED_TAGS, type PredefinedTag } from '@/lib/archives/types';
import { Check } from 'lucide-react';

interface ForgeFormProps {
  userInput: string;
  setUserInput: (val: string) => void;
  caption: string;
  setCaption: (val: string) => void;
  selectedTags: PredefinedTag[];
  setSelectedTags: (tags: PredefinedTag[]) => void;
}

const EXAMPLES = [
  'croisHorney bakery in space, chart brain meltdown',
  'eichHorney hoarding candles, neon chaos',
  'metaHorney recursion portal, absurd symbols',
];

export const ForgeForm: React.FC<ForgeFormProps> = ({
  userInput,
  setUserInput,
  caption,
  setCaption,
  selectedTags,
  setSelectedTags,
}) => {
  const toggleTag = (tag: PredefinedTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Input */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label className="text-sm font-semibold block">Keywords / Visual Idea</label>
          <div className="flex gap-1">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setUserInput(ex)}
                className="text-[10px] bg-muted hover:bg-muted-foreground/20 px-2 py-0.5 rounded transition-colors"
              >
                Try ex {i + 1}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g. croisHorney bakery in space, chart brain meltdown"
          className="bg-muted min-h-[100px] resize-none border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        {userInput.length > 0 && userInput.length < 10 && (
          <p className="text-[10px] text-yellow-500">Add 3–10 keywords for better results.</p>
        )}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <label className="text-sm font-semibold block">
          Caption <span className="text-muted-foreground font-normal">(for gallery)</span>
        </label>
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 140))}
          placeholder="Describe your artifact..."
          className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary"
          maxLength={140}
        />
        <p className="text-[10px] text-right text-muted-foreground">{caption.length}/140</p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-semibold block">
          Tags <span className="text-muted-foreground font-normal">({selectedTags.length}/3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

