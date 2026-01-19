import { ExternalLink } from "lucide-react";
import type { DashboardDTO } from "./types";
import { useCopy } from "@/lib/theme/copy";

const RewardsCard = ({ rewards }: { rewards: DashboardDTO["rewards"] }) => {
  const t = useCopy();
  const recent = rewards?.recent ?? [];

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("rewards.snapshot")}</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("rewards.readOnly")}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("rewards.pending.title")}</span>
          <span className="font-semibold">{rewards?.pendingCount ?? 0}</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t("rewards.recent.title")}</p>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("rewards.recent.empty")}</p>
          ) : (
            <div className="space-y-3">
              {recent.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{entry.amountText}</p>
                    <p className="text-xs text-muted-foreground">{entry.createdAt}</p>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <a
          href="/rewards"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {t("rewards.rules.title")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default RewardsCard;
