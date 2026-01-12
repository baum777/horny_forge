import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_BADGES } from "../../badges/unifiedBadges";

export function BadgeGrid({ unlocked }: { unlocked: string[] }) {
  const list = ALL_BADGES.filter((b) => unlocked.includes(b.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Badges</CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-sm opacity-70">No badges yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {list.map((b) => (
              <div key={b.id} className="rounded-xl border p-3 flex items-center gap-3">
                <div className="text-2xl">{b.emoji ?? "🦄"}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.name}</div>
                  <div className="text-xs opacity-70 truncate">{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

