import React, { useEffect, useMemo, useState } from 'react';
import { BASE_IMAGE_UNLOCKS, isBaseUnlocked } from 'lib/gamification/eventProcessor';
import { useCopy } from '@/lib/theme/copy';

export type BaseSelection = {
  id: string;
  image: string;
  label: string;
  locked: boolean;
  unlockLevel?: number;
};

interface BasePickerProps {
  selectedBase: BaseSelection | null;
  onSelect: (base: BaseSelection) => void;
  userLevel: number;
}

const baseIdFromPath = (value: string): string => {
  const file = value.split('/').pop() ?? value;
  return file.replace(/\.[^.]+$/, '');
};

const labelFromPath = (value: string): string => {
  const file = value.split('/').pop() ?? value;
  return file;
};

export const BasePicker: React.FC<BasePickerProps> = ({ selectedBase, onSelect, userLevel }) => {
  const t = useCopy();
  const [options, setOptions] = useState<BaseSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch('/api/asset-pool')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const files = Array.isArray(data?.files) ? data.files : [];
        const mapped = files.map((file: string) => {
          const id = baseIdFromPath(file);
          const unlockLevel = BASE_IMAGE_UNLOCKS[id];
          const locked = !isBaseUnlocked(userLevel, id);
          const image = file;
          return {
            id,
            image,
            label: labelFromPath(file),
            locked,
            unlockLevel,
          } satisfies BaseSelection;
        });

        setOptions(mapped);
      })
      .catch(() => {
        if (!active) return;
        setOptions([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userLevel]);

  const unlockedOptions = useMemo(() => options.filter((option) => !option.locked), [options]);

  useEffect(() => {
    if (!selectedBase && unlockedOptions.length > 0) {
      onSelect(unlockedOptions[0]);
    }
  }, [selectedBase, unlockedOptions, onSelect]);

  const currentValue = selectedBase?.image ?? '';

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">{t('generator.basePicker.label')}</label>
      <select
        className="w-full rounded-lg border border-white/10 bg-muted/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
        disabled={loading || options.length === 0}
        value={currentValue}
        onChange={(event) => {
          const next = options.find((option) => option.image === event.target.value);
          if (next && !next.locked) {
            onSelect(next);
          }
        }}
      >
        {loading && <option>{t('common.loading')}</option>}
        {!loading && options.length === 0 && <option>{t('generator.basePicker.empty')}</option>}
        {options.map((option) => (
          <option key={option.image} value={option.image} disabled={option.locked}>
            {option.label}
            {option.locked && option.unlockLevel
              ? ` (${t('generator.basePicker.unlockAt', { level: option.unlockLevel })})`
              : option.locked
                ? ` (${t('generator.basePicker.locked')})`
                : ''}
          </option>
        ))}
      </select>

      {selectedBase && (
        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-muted/30 p-3">
          <img
            src={selectedBase.image}
            alt={selectedBase.label}
            className="h-20 w-20 rounded-lg object-cover"
          />
          <div>
            <div className="text-xs font-semibold">{selectedBase.label}</div>
            <div className="text-[10px] text-muted-foreground break-all">{selectedBase.image}</div>
          </div>
        </div>
      )}
    </div>
  );
};
