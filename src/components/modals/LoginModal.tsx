import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setUser, type User } from '@/lib/storage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMockLogin = async () => {
    if (!handle.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user: User = {
      handle: handle.replace('@', ''),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${handle}`,
      joinedAt: new Date().toISOString(),
    };
    
    setUser(user);
    setIsLoading(false);
    onSuccess(user);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="neon-border rounded-2xl bg-card p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Twitter className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Login with X</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Join the Horny Meta Universe
                </p>
              </div>

              {/* MVP Notice */}
              <div className="mb-6 p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-xs text-center text-accent">
                  ⚠️ MVP Demo: Enter any handle to simulate login. Real X OAuth coming soon.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your X Handle</label>
                  <Input
                    placeholder="@yourhandle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleMockLogin}
                  disabled={!handle.trim() || isLoading}
                >
                  {isLoading ? 'Entering the Meta...' : 'ENTER THE HORNY META'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By logging in, you accept that you're horny for gains and ready for the meta.
                </p>
              </div>

              {/* Future integration note */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  🔌 Integration point: Replace with real X OAuth flow
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
