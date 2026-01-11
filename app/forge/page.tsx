"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import NavBar from '@/components/nav/NavBar';
import { BasePicker } from '@/components/forge/BasePicker';
import { PresetPicker } from '@/components/forge/PresetPicker';
import { ForgeForm } from '@/components/forge/ForgeForm';
import { ForgePreview } from '@/components/forge/ForgePreview';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserStats } from '@/lib/hooks/useUserStats';
import { getPresetUnlockLevel, getBaseUnlockLevel } from '@/lib/gamification/badgeRules';
import type { BaseId } from '@/lib/forge/promptEngine';
import type { Preset } from '@/lib/forge/promptEngine';

type ForgeResponse = {
  generation_id: string;
  image_url: string;
  base_id: BaseId;
  preset: Preset;
};

export default function ForgePage() {
  const router = useRouter();
  const { isAuthenticated, profile } = useAuth();
  const { stats } = useUserStats();
  const userLevel = stats?.level ?? 1;

  const [selectedBaseId, setSelectedBaseId] = useState<BaseId | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset>('HORNY_CORE_SKETCH');
  const [userInput, setUserInput] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ForgeResponse | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  const handleInfuse = async () => {
    if (!selectedBaseId) {
      toast.error('Select a base image first.');
      return;
    }
    
    // Check if base is locked
    const baseUnlockLevel = getBaseUnlockLevel(selectedBaseId);
    if (baseUnlockLevel !== null && baseUnlockLevel > userLevel) {
      toast.error(`Unlock ${selectedBaseId} at Level ${baseUnlockLevel}`);
      return;
    }
    
    // Check if preset is locked
    const presetUnlockLevel = getPresetUnlockLevel(selectedPreset);
    if (presetUnlockLevel !== null && presetUnlockLevel > userLevel) {
      toast.error(`Unlock ${selectedPreset} at Level ${presetUnlockLevel}`);
      return;
    }
    
    if (!userInput.trim() || userInput.trim().length < 3) {
      toast.error('Add some keywords (at least 3 characters).');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_id: selectedBaseId,
          preset: selectedPreset,
          user_input: userInput,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate');
      }

      const result = await res.json();
      setGeneratedResult(result);
      toast.success('Artifact stabilized.');
    } catch (error: any) {
      toast.error(error.message || 'Artifact unstable. Retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRelease = async () => {
    if (!generatedResult) return;
    if (!isAuthenticated || !profile) {
      toast.error('Login required to release artifacts.');
      return;
    }
    if (selectedTags.length === 0) {
      toast.error('Select at least 1 tag.');
      return;
    }

    setIsReleasing(true);
    try {
      const res = await fetch('/api/forge/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_id: generatedResult.generation_id,
          caption: caption.trim() || 'Untitled Artifact',
          tags: selectedTags,
          image_url: generatedResult.image_url,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to release');
      }

      const data = await res.json();
      toast.success('Artifact released to THE ARCHIVES.');
      setTimeout(() => {
        router.push(data.redirect_url);
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to release artifact.');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-gradient mb-3">
            META FORGE
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Create legendary memes with sacred bases — AI-infused.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-10">
            <BasePicker
              selectedBaseId={selectedBaseId}
              onSelect={setSelectedBaseId}
            />

            <PresetPicker
              selectedPreset={selectedPreset}
              onSelect={setSelectedPreset}
            />

            <ForgeForm
              userInput={userInput}
              setUserInput={setUserInput}
              caption={caption}
              setCaption={setCaption}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />

            <div className="pt-4">
              <Button
                variant="gradient"
                size="lg"
                className="w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all"
                onClick={handleInfuse}
                disabled={isGenerating || isReleasing}
              >
                {isGenerating ? 'INFUSING...' : 'INFUSE (AI FORGE)'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest">
                Consumption of $HORNY might occur
              </p>
            </div>
          </div>

          <div className="relative">
            <ForgePreview
              image={generatedResult?.image_url || null}
              isGenerating={isGenerating}
              metadata={generatedResult}
              onRegenerate={handleInfuse}
              onRelease={handleRelease}
              isReleasing={isReleasing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

