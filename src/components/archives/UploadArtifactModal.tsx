import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PREDEFINED_TAGS, type PredefinedTag } from '@/lib/archives/types';
import { uploadArtifactImage } from 'lib/supabase/queries';
import { useCopy } from '@/lib/theme/copy';

interface UploadArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function UploadArtifactModal({ isOpen, onClose }: UploadArtifactModalProps) {
  const t = useCopy();
  const { archivesUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<PredefinedTag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error(t('upload.errors.invalidType'));
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(t('upload.errors.maxSize'));
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const toggleTag = (tag: PredefinedTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      toast.error(t('upload.errors.maxTags'));
    }
  };

  const handleSubmit = async () => {
    if (!file || !caption.trim() || selectedTags.length === 0) {
      toast.error(t('upload.errors.required'));
      return;
    }

    if (!isAuthenticated || !archivesUser) {
      toast.error(t('upload.errors.loginRequired'));
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload image to storage
      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await uploadArtifactImage({
        userId: archivesUser.id,
        file,
      });
      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const publicUrl = uploadData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to resolve public URL');

      setUploadProgress(80);

      // Insert artifact record
      const { data: artifact, error: insertError } = await supabase
        .from('artifacts')
        .insert({
          image_url: publicUrl,
          caption: caption.trim(),
          tags: selectedTags,
          author_id: archivesUser.id,
          author_handle: archivesUser.handle,
          author_avatar: archivesUser.avatar,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(100);
      toast.success(t('upload.success'));
      
      // Reset form
      setFile(null);
      setPreview(null);
      setCaption('');
      setSelectedTags([]);
      onClose();
      
      // Navigate to the new artifact
      navigate(`/archives/${artifact.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(t('upload.errors.failed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setSelectedTags([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={resetForm}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="glass-card p-6 rounded-2xl relative">
              <button
                onClick={resetForm}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  {t('upload.title')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('upload.subtitle')}
                </p>
              </div>

              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 mb-6 cursor-pointer transition-all
                  ${preview ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {preview ? (
                  <img
                    src={preview}
                    alt={t('upload.previewAlt')}
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {t('upload.dropzone')}
                    </p>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('upload.caption', { count: caption.length })}
                </label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 140))}
                  placeholder={t('upload.captionPlaceholder')}
                  className="bg-background/50"
                  maxLength={140}
                />
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  {t('upload.tags', { count: selectedTags.length })}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-all
                        ${selectedTags.includes(tag)
                          ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }
                      `}
                    >
                      {selectedTags.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-destructive"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {t('upload.progress', { value: uploadProgress })}
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={uploading || !file || !caption.trim() || selectedTags.length === 0}
                variant="gradient"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? t('upload.submitting') : t('upload.submit')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
