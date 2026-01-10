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
  },
  {
    id: 'HORNY_META_SCENE',
    label: 'META',
    description: 'epic scenes',
    fullDescription: 'epic scenes, lore expansions',
  },
  {
    id: 'HORNY_CHAOS_VARIATION',
    label: 'CHAOS',
    description: 'cursed energy, still doodle',
    fullDescription: 'wild, but still branded chaos',
  },
] as const;

export type PresetId = typeof PRESETS[number]['id'];

interface PresetPickerProps {
  selectedPreset: PresetId;
  onSelect: (id: PresetId) => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({ selectedPreset, onSelect }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">Preset Guardrails</label>
      <Select value={selectedPreset} onValueChange={(value) => onSelect(value as PresetId)}>
        <SelectTrigger className="w-full bg-muted border-none">
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <span className="font-bold">{preset.label}</span> — {preset.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground italic">
        {PRESETS.find((p) => p.id === selectedPreset)?.fullDescription}
      </p>
    </div>
  );
};

