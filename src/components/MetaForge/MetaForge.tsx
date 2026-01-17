import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { forgeArtifact, releaseArtifact, type ForgeResponse, type ReleaseError } from '@/lib/api/forge';
import { BasePicker, type BaseSelection } from './BasePicker';
import { PresetPicker, type PresetId } from './PresetPicker';
import { ForgeForm } from './ForgeForm';
import { ForgePreview } from './ForgePreview';
import { Button } from '@/components/ui/button';
import { type PredefinedTag } from '@/lib/archives/types';
import { openXShare } from '@/lib/share';
import { getShareRedirectUrl } from '@/lib/api/share';
import { useGamification } from '@/hooks/useGamification';
import { postGamificationEvent } from '@/lib/api/event';
import { isBaseUnlocked, isPresetUnlocked } from 'lib/gamification/eventProcessor';
import { clientGamificationEnabled } from '@/lib/gamificationFlags';

export default function MetaForge() {
  const { archivesUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { stats } = useGamification(archivesUser?.id);

  // Form State
  const [selectedBase, setSelectedBase] = useState<BaseSelection | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('HORNY_CORE_SKETCH');
  const [userInput, setUserInput] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<PredefinedTag[]>([]);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ForgeResponse | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releasedId, setReleasedId] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<ReleaseError | null>(null);
  const userLevel = stats?.level ?? 1;
  const unlockLevel = clientGamificationEnabled ? userLevel : Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    if (!clientGamificationEnabled) return;
    if (selectedBase && !isBaseUnlocked(userLevel, selectedBase.id)) {
      setSelectedBase(null);
    }
  }, [selectedBase, userLevel]);

  useEffect(() => {
    if (!clientGamificationEnabled) return;
    if (!isPresetUnlocked(userLevel, selectedPreset)) {
      setSelectedPreset('HORNY_CORE_SKETCH');
    }
  }, [selectedPreset, userLevel]);

  const handleInfuse = async () => {
    if (!selectedBase) {
      toast.error('Select a base image first.');
      return;
    }
    if (!userInput.trim()) {
      toast.error('Add some keywords or a visual idea.');
      return;
    }
    if (userInput.trim().length < 3) {
      toast.error('Input too short. Add more keywords.');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);
    setReleasedId(null);
    setReleaseError(null);

    try {
      const result = await forgeArtifact({
        base_id: selectedBase.id,
        base_image: selectedBase.image,
        preset: selectedPreset,
        user_input: userInput,
      });
      setGeneratedResult(result);
      toast.success('Artifact stabilized.');
      if (isAuthenticated) {
        void postGamificationEvent({
          event_id: crypto.randomUUID(),
          type: 'forge_generate',
        });
      }
    } catch (error: unknown) {
      console.error('Forge error:', error);
      const errorObj = error && typeof error === 'object' && 'code' in error ? error as { code?: string; error?: string } : null;
      const errorMessage = errorObj?.error || (error instanceof Error ? error.message : 'Artifact unstable. Retry.');
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRelease = async () => {
    if (!generatedResult) return;
    if (!isAuthenticated || !archivesUser) {
      toast.error('Login required to release artifacts.');
      return;
    }
    if (selectedTags.length === 0) {
      toast.error('Select at least 1 tag.');
      return;
    }

    setIsReleasing(true);
    setReleaseError(null);
    try {
      const releaseResponse = await releaseArtifact({
        generation_id: generatedResult.generation_id,
        caption: caption.trim() || 'Untitled Artifact',
        tags: selectedTags,
      });

      setReleasedId(releaseResponse.artifact_id);
      toast.success('Artifact released to THE ARCHIVES.');
      void postGamificationEvent({
        event_id: crypto.randomUUID(),
        type: 'artifact_release',
        subject_id: releaseResponse.artifact_id,
      });
      
      // Redirect after a short delay so user can see the share button or the success state
      setTimeout(() => {
        navigate(releaseResponse.redirect_url);
      }, 2000);
    } catch (error: unknown) {
      console.error('Release error:', error);
      const errorObj = error && typeof error === 'object' && 'code' in error ? error as { code?: string; error?: string } : null;
      if (errorObj?.code === 'OFF_BRAND' || errorObj?.error === 'off_brand') {
        setReleaseError(error as ReleaseError);
        toast.error('Off-brand artifact. Try again using the suggested base.');
      } else {
        toast.error('Failed to release artifact. Try again.');
      }
    } finally {
      setIsReleasing(false);
    }
  };

  const handleShare = async () => {
    if (!releasedId) return;
    const url =
      (await getShareRedirectUrl(releasedId)) ?? `${window.location.origin}/archives/${releasedId}`;
    openXShare({
      text: `Just forged a legendary artifact in THE HORNY ARCHIVES! ${caption}`,
      url: url,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-gradient mb-3">
          META FORGE
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Create legendary memes with sacred bases — AI-infused.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column: Controls */}
        <div className="space-y-10">
          <BasePicker
            selectedBase={selectedBase}
            onSelect={setSelectedBase}
            userLevel={unlockLevel}
          />

          <PresetPicker
            selectedPreset={selectedPreset}
            onSelect={setSelectedPreset}
            userLevel={unlockLevel}
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

        {/* Right Column: Preview */}
        <div className="relative">
          <ForgePreview
            image={generatedResult?.image_url || null}
            isGenerating={isGenerating}
            metadata={generatedResult}
            onRegenerate={handleInfuse}
            onRelease={handleRelease}
            onShare={handleShare}
            isReleasing={isReleasing}
            releasedId={releasedId}
            releaseError={releaseError}
          />
        </div>
      </div>
    </div>
  );
}
