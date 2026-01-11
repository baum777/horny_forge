import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw, Rocket, Eye, Clock, Layers, Zap } from 'lucide-react';
import { ForgeResponse, type ReleaseError } from '@/lib/api/forge';

interface ForgePreviewProps {
  image: string | null;
  isGenerating: boolean;
  metadata: ForgeResponse | null;
  onRegenerate: () => void;
  onRelease: () => void;
    onShare: () => void;
    loadingCopy?: string;
    isReleasing?: boolean;
    releasedId?: string | null;
    releaseError?: ReleaseError | null;
}

export const ForgePreview: React.FC<ForgePreviewProps> = ({
    image,
    isGenerating,
    metadata,
    onRegenerate,
    onRelease,
    onShare,
    loadingCopy = 'Desire is forming...',
    isReleasing = false,
    releasedId = null,
    releaseError = null,
}) => {
    const showOffBrand = releaseError?.code === 'OFF_BRAND' || releaseError?.error === 'off_brand';
    const showUnsafe = releaseError?.code === 'UNSAFE_PROMPT' || releaseError?.error === 'unsafe_prompt';

    return (
        <div className="space-y-6 sticky top-8">
            <label className="text-sm font-semibold block">Artifact Preview</label>
            <GlassCard
                variant="neon"
                className="aspect-square flex items-center justify-center overflow-hidden relative"
            >
                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center text-center space-y-4 p-8"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <Zap className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="text-primary font-medium animate-pulse">{loadingCopy}</p>
                            <p className="text-[10px] text-muted-foreground">Stabilizing the artifact...</p>
                        </motion.div>
                    ) : image ? (
                        <motion.div
                            key="image"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group w-full h-full"
                        >
                            <img
                                src={image}
                                alt="Forged Artifact"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="outline" size="sm" onClick={() => window.open(image, '_blank')}>
                                    <Eye className="w-4 h-4 mr-2" /> View Full
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-muted-foreground p-8"
                        >
                            <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Your artifact will appear here</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>

            {/* Metadata Panel */}
            {metadata && !isGenerating && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-xl p-4 border border-white/5 space-y-3"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase flex items-center">
                                <Zap className="w-3 h-3 mr-1" /> Preset
                            </p>
                            <p className="text-xs font-mono">{metadata.preset}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase flex items-center">
                                <Layers className="w-3 h-3 mr-1" /> Base
                            </p>
                            <p className="text-xs font-mono">{metadata.base_id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> Generated
                            </p>
                            <p className="text-xs font-mono">
                                {new Date(metadata.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase">Gen ID</p>
                            <p className="text-xs font-mono truncate">{metadata.generation_id}</p>
                        </div>
                    </div>

                    {metadata.debug?.final_prompt && (
                        <details className="cursor-pointer group">
                            <summary className="text-[10px] text-muted-foreground hover:text-foreground transition-colors list-none">
                                + Show Prompt Details
                            </summary>
                            <div className="mt-2 p-2 bg-black/40 rounded border border-white/5">
                                <p className="text-[10px] font-mono leading-relaxed text-muted-foreground">
                                    {metadata.debug.final_prompt}
                                </p>
                            </div>
                        </details>
                    )}
                </motion.div>
            )}

            {/* Actions */}
            {image && !isGenerating && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    {(showOffBrand || showUnsafe) && (
                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-muted-foreground space-y-3">
                            {showOffBrand && (
                                <>
                                    <p className="text-foreground font-semibold">Release blocked: off-brand output.</p>
                                    <p>
                                        Use base{' '}
                                        <span className="text-foreground font-mono">
                                            {releaseError?.base_match_id ?? metadata?.base_id ?? 'base-01'}
                                        </span>{' '}
                                        / preset{' '}
                                        <span className="text-foreground font-mono">
                                            {metadata?.preset ?? 'HORNY_CORE_SKETCH'}
                                        </span>{' '}
                                        and try again.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={onRegenerate}>
                                        Try again
                                    </Button>
                                </>
                            )}
                            {showUnsafe && (
                                <p className="text-foreground font-semibold">
                                    Release blocked by safety checks. Please try a different idea.
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 bg-muted/50 border-white/10"
                            onClick={onRegenerate}
                            disabled={isReleasing}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                        </Button>
                        {!releasedId ? (
                            <Button
                                variant="gradient"
                                className="flex-1"
                                onClick={onRelease}
                                disabled={isReleasing}
                            >
                                <Rocket className="w-4 h-4 mr-2" />
                                {isReleasing ? 'Releasing...' : 'Release Artifact'}
                            </Button>
                        ) : (
                            <Button
                                variant="neon"
                                className="flex-1"
                                onClick={onShare}
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share to X
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
