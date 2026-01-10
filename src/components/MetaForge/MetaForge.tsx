import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { forgeArtifact, type ForgeResponse } from '@/lib/api/forge';
import { BasePicker, type BaseId } from './BasePicker';
import { PresetPicker, type PresetId } from './PresetPicker';
import { ForgeForm } from './ForgeForm';
import { ForgePreview } from './ForgePreview';
import { Button } from '@/components/ui/button';
import { type PredefinedTag } from '@/lib/archives/types';
import { uploadArtifactImage } from 'lib/supabase/queries';
import { openXShare, getMemeShareText, getShareUrl } from '@/lib/share';

export default function MetaForge() {
  const { archivesUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [selectedBaseId, setSelectedBaseId] = useState<BaseId | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('HORNY_CORE_SKETCH');
  const [userInput, setUserInput] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<PredefinedTag[]>([]);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ForgeResponse | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releasedId, setReleasedId] = useState<string | null>(null);

  const handleInfuse = async () => {
    if (!selectedBaseId) {
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

    try {
      const result = await forgeArtifact({
        base_id: selectedBaseId,
        preset: selectedPreset,
        user_input: userInput,
      });
      setGeneratedResult(result);
      toast.success('Artifact stabilized.');
    } catch (error: any) {
      console.error('Forge error:', error);
      toast.error(error.error || 'Artifact unstable. Retry.');
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
    try {
      // 1. Download image from generated URL
      const response = await fetch(generatedResult.image_url);
      const blob = await response.blob();
      const file = new File([blob], `artifact-${Date.now()}.png`, { type: 'image/png' });

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await uploadArtifactImage({
        userId: archivesUser.id,
        file,
      });

      if (uploadError) throw uploadError;
      if (!uploadData?.publicUrl) throw new Error('Failed to get public URL');

      // 3. Insert into artifacts table
      const { data: artifact, error: insertError } = await supabase
        .from('artifacts')
        .insert({
          image_url: uploadData.publicUrl,
          caption: caption.trim() || 'Untitled Artifact',
          tags: selectedTags,
          author_id: archivesUser.id,
          author_handle: archivesUser.handle,
          author_avatar: archivesUser.avatar,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setReleasedId(artifact.id);
      toast.success('Artifact released to THE ARCHIVES.');
      
      // Redirect after a short delay so user can see the share button or the success state
      setTimeout(() => {
        navigate(`/archives/${artifact.id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Release error:', error);
      toast.error('Failed to release artifact. Try again.');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleShare = () => {
    if (!releasedId) return;
    const url = getShareUrl(`/archives/${releasedId}`);
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
          />
        </div>
      </div>
    </div>
  );
}

