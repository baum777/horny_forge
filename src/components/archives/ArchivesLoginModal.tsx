import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ArchivesLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchivesLoginModal({ isOpen, onClose }: ArchivesLoginModalProps) {
  const { signInWithTwitter, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTwitterLogin = async () => {
    setLoading(true);
    const { error } = await signInWithTwitter();
    if (error) {
      toast.error('Not horny enough. Retry.');
      console.error(error);
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        toast.error(error.message || 'Not horny enough. Retry.');
      } else {
        toast.success('Welcome back to the Archives.');
        onClose();
      }
    } else {
      if (!handle.trim()) {
        toast.error('Handle required for the Archives.');
        setLoading(false);
        return;
      }
      const { error } = await signUpWithEmail(email, password, handle);
      if (error) {
        toast.error(error.message || 'Not horny enough. Retry.');
      } else {
        toast.success('Welcome to the Archives.');
        onClose();
      }
    }

    setLoading(false);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6"
          >
            <div className="glass-card p-6 rounded-2xl relative">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  Enter the Archives
                </h2>
                <p className="text-muted-foreground text-sm">
                  Login with X to infuse and vote.
                </p>
              </div>

              <Button
                onClick={handleTwitterLogin}
                disabled={loading}
                className="w-full mb-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
              >
                <Twitter className="w-5 h-5 mr-2" />
                Continue with X
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or use email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <Input
                    type="text"
                    placeholder="Handle (e.g., MetaDemon)"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="bg-background/50"
                    maxLength={30}
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                  required
                  minLength={6}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  variant="gradient"
                  className="w-full"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-4">
                {mode === 'login' ? (
                  <>
                    New to the Archives?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already initiated?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-primary hover:underline"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
