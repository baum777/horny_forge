import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const PRESETS = [
  {
    id: 'HORNY_CORE_SKETCH',
    label: 'CORE',
    description: 'tight brand lock',
    fullDescription: 'tightest, safest brand sketches',
    unlockLevel: 1,
  },
  {
    id: 'HORNY_META_SCENE',
    label: 'META',
    description: 'epic scenes',
    fullDescription: 'epic scenes, lore expansions',
    unlockLevel: 2,
  },
  {
    id: 'HORNY_CHAOS_VARIATION',
    label: 'CHAOS',
    description: 'cursed energy, still doodle',
    fullDescription: 'wild, but still branded chaos',
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
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">Preset Guardrails</label>
      <Select value={selectedPreset} onValueChange={(value) => onSelect(value as PresetId)}>
        <SelectTrigger className="w-full bg-muted border-none">
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => {
            const isLocked = userLevel < preset.unlockLevel;
            return (
              <SelectItem key={preset.id} value={preset.id} disabled={isLocked}>
                <span className="font-bold">{preset.label}</span> — {preset.description}
                {isLocked && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    Unlock at Level {preset.unlockLevel}
                  </span>
                )}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground italic">
        {PRESETS.find((p) => p.id === selectedPreset)?.fullDescription}
      </p>
    </div>
  );
};
