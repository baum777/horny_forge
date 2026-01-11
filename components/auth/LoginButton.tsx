"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";

export function LoginButton() {
  const { loginWithX, loading } = useAuth();

  const handleClick = async () => {
    await loginWithX();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading}>
      Login with X
    </Button>
  );
}

