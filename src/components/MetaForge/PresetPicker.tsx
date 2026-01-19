import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCopy } from '@/lib/theme/copy';

export const PRESETS = [
  {
    id: 'HORNY_CORE_SKETCH',
    labelKey: 'generator.presets.core.label',
    descriptionKey: 'generator.presets.core.description',
    fullDescriptionKey: 'generator.presets.core.fullDescription',
    unlockLevel: 1,
  },
  {
    id: 'HORNY_META_SCENE',
    labelKey: 'generator.presets.meta.label',
    descriptionKey: 'generator.presets.meta.description',
    fullDescriptionKey: 'generator.presets.meta.fullDescription',
    unlockLevel: 2,
  },
  {
    id: 'HORNY_CHAOS_VARIATION',
    labelKey: 'generator.presets.chaos.label',
    descriptionKey: 'generator.presets.chaos.description',
    fullDescriptionKey: 'generator.presets.chaos.fullDescription',
    unlockLevel: 4,
  },
] as const;

export type PresetId = typeof PRESETS[number]['id'];

interface PresetPickerProps {
  selectedPreset: PresetId;
  onSelect: (id: PresetId) => void;
  userLevel: number;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({ selectedPreset, onSelect, userLevel }) => {
  const t = useCopy();

  const selectedPresetCopy = PRESETS.find((preset) => preset.id === selectedPreset);
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">{t('generator.presets.label')}</label>
      <Select value={selectedPreset} onValueChange={(value) => onSelect(value as PresetId)}>
        <SelectTrigger className="w-full bg-muted border-none">
          <SelectValue placeholder={t('generator.presets.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => {
            const isLocked = userLevel < preset.unlockLevel;
            return (
              <SelectItem key={preset.id} value={preset.id} disabled={isLocked}>
                <span className="font-bold">{t(preset.labelKey)}</span> — {t(preset.descriptionKey)}
                {isLocked && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    {t('generator.presets.unlockAt', { level: preset.unlockLevel })}
                  </span>
                )}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground italic">
        {selectedPresetCopy ? t(selectedPresetCopy.fullDescriptionKey) : ''}
      </p>
    </div>
  );
};
