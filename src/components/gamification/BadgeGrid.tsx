import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_BADGES } from "../../badges/unifiedBadges";
import { useCopy } from "@/lib/theme/copy";

export function BadgeGrid({ unlocked }: { unlocked: string[] }) {
  const t = useCopy();
  const list = ALL_BADGES.filter((b) => unlocked.includes(b.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("badges.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-sm opacity-70">{t("badges.empty")}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {list.map((b) => (
              <div key={b.id} className="rounded-xl border p-3 flex items-center gap-3">
                <div className="text-2xl">{b.emoji ?? "🦄"}</div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t(b.nameKey)}</div>
                  <div className="text-xs opacity-70 truncate">{t(b.descriptionKey)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

