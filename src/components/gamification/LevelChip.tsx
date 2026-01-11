import { Badge } from "@/components/ui/badge";

export function LevelChip({ level }: { level: number }) {
  return (
    <Badge variant="secondary" className="gap-2">
      <span className="opacity-70">Level</span>
      <span className="font-semibold">{level}</span>
    </Badge>
  );
}

