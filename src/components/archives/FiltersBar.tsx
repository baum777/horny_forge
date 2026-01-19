import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, Trophy, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PREDEFINED_TAGS, type SortOption } from '@/lib/archives/types';
import { useCopy } from '@/lib/theme/copy';

interface FiltersBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

const sortOptions: { value: SortOption; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'newest', labelKey: 'gallery.sort.live', icon: <Clock className="w-4 h-4" /> },
  { value: 'top24h', labelKey: 'gallery.sort.top24h', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'topAll', labelKey: 'gallery.sort.topAll', icon: <Trophy className="w-4 h-4" /> },
];

export function FiltersBar({
  sort,
  onSortChange,
  search,
  onSearchChange,
  selectedTag,
  onTagChange,
}: FiltersBarProps) {
  const t = useCopy();
  const [showTagPicker, setShowTagPicker] = useState(false);

  return (
    <div className="space-y-4">
      {/* Sort & Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Sort Buttons */}
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              variant={sort === option.value ? 'gradient' : 'outline'}
              size="sm"
              className="gap-1.5"
            >
              {option.icon}
              {t(option.labelKey)}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('gallery.search.placeholder')}
            className="pl-9 bg-background/50"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="relative">
        <Button
          onClick={() => setShowTagPicker(!showTagPicker)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {selectedTag || t('gallery.filter.tag')}
          <ChevronDown className={`w-4 h-4 transition-transform ${showTagPicker ? 'rotate-180' : ''}`} />
        </Button>

        {selectedTag && (
          <Button
            onClick={() => onTagChange(null)}
            variant="ghost"
            size="sm"
            className="ml-2 text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            {t('common.clear')}
          </Button>
        )}

        <AnimatePresence>
          {showTagPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 z-20 glass-card p-3 rounded-xl max-w-md"
            >
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      onTagChange(tag);
                      setShowTagPicker(false);
                    }}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all
                      ${selectedTag === tag
                        ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
