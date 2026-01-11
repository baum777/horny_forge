"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock } from 'lucide-react';
import { getPresetUnlockLevel } from '@/lib/gamification/badgeRules';
import { useUserStats } from '@/lib/hooks/useUserStats';
import type { Preset } from '@/lib/forge/promptEngine';

export const PRESETS = [
  {
    id: 'HORNY_CORE_SKETCH' as Preset,
    label: 'CORE',
    description: 'tight brand lock',
    fullDescription: 'tightest, safest brand sketches',
  },
  {
    id: 'HORNY_META_SCENE' as Preset,
    label: 'META',
    description: 'epic scenes',
    fullDescription: 'epic scenes, lore expansions',
  },
  {
    id: 'HORNY_CHAOS_VARIATION' as Preset,
    label: 'CHAOS',
    description: 'cursed energy, still doodle',
    fullDescription: 'wild, but still branded chaos',
  },
] as const;

interface PresetPickerProps {
  selectedPreset: Preset;
  onSelect: (id: Preset) => void;
}

export function PresetPicker({ selectedPreset, onSelect }: PresetPickerProps) {
  const { stats } = useUserStats();
  const userLevel = stats?.level ?? 1;

  const isPresetLocked = (presetId: Preset): boolean => {
    const unlockLevel = getPresetUnlockLevel(presetId);
    return unlockLevel !== null && unlockLevel > userLevel;
  };

  const handleSelect = (value: string) => {
    const preset = value as Preset;
    const unlockLevel = getPresetUnlockLevel(preset);
    
    if (unlockLevel !== null && unlockLevel > userLevel) {
      return; // Don't allow selection of locked presets
    }
    
    onSelect(preset);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold block">Preset Guardrails</label>
      <Select value={selectedPreset} onValueChange={handleSelect}>
        <SelectTrigger className="w-full bg-muted border-none">
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => {
            const locked = isPresetLocked(preset.id);
            const unlockLevel = getPresetUnlockLevel(preset.id);
            
            return (
              <SelectItem 
                key={preset.id} 
                value={preset.id}
                disabled={locked}
                className={locked ? "opacity-50 cursor-not-allowed" : ""}
              >
                <div className="flex items-center gap-2">
                  {locked && <Lock className="w-3 h-3" />}
                  <span className="font-bold">{preset.label}</span> — {preset.description}
                  {locked && unlockLevel && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      (Level {unlockLevel})
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground italic">
        {PRESETS.find((p) => p.id === selectedPreset)?.fullDescription}
        {isPresetLocked(selectedPreset) && (
          <span className="block mt-1 text-primary">
            🔒 Unlock at Level {getPresetUnlockLevel(selectedPreset)}
          </span>
        )}
      </p>
    </div>
  );
}

