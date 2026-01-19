import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCopy } from '@/lib/theme/copy';

interface ArchivesLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ArchivesLoginModal({ isOpen, onClose, onSuccess }: ArchivesLoginModalProps) {
  const t = useCopy();
  const { signInWithTwitter } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleXLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await signInWithTwitter();
      if (authError) {
        setError(t('auth.errors.connectFailed'));
        console.error(authError);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(t('auth.errors.connectFailed'));
      console.error('X login error:', err);
    } finally {
      setLoading(false);
    }
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4"
          >
            <div className="glass-card p-6 rounded-2xl relative neon-border">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🔥</div>
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  {t('auth.modal.title')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('auth.modal.subtitle')}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                onClick={handleXLogin}
                disabled={loading}
                className="w-full gap-3 h-12 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                {loading ? t('auth.modal.connecting') : t('auth.modal.cta')}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-6">
                {t('auth.modal.termsPrefix')}{' '}
                <a href="/legal" className="text-primary hover:underline">
                  {t('auth.modal.termsLink')}
                </a>{' '}
                {t('auth.modal.termsSuffix')}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
