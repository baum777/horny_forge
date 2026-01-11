"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { Twitter } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithX, loading } = useAuth();

  const handleLogin = async () => {
    await loginWithX();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login to THE HORNY ARCHIVES</DialogTitle>
          <DialogDescription>
            Connect with X to vote, forge, and release artifacts.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#1DA1F2] hover:bg-[#1a8cd8]"
          >
            <Twitter className="w-4 h-4 mr-2" />
            {loading ? 'Connecting...' : 'Login with X'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

