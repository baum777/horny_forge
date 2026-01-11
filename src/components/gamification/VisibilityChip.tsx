import { Badge } from "@/components/ui/badge";
import type { VisibilityTier } from "../../gamification/types";

const map: Record<VisibilityTier, string> = {
  private: "Private",
  semi: "Semi",
  public: "Public",
  viral: "Viral",
};

export function VisibilityChip({ tier }: { tier: VisibilityTier }) {
  return <Badge className="uppercase tracking-wide">{map[tier]}</Badge>;
}

