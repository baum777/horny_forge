import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PageShell } from "@/components/layout/PageShell";
import DashboardShell from "@/components/dashboard/DashboardShell";
import UserStatusCard from "@/components/dashboard/UserStatusCard";
import ActionList from "@/components/dashboard/ActionList";
import BadgeStrip from "@/components/dashboard/BadgeStrip";
import RewardsCard from "@/components/dashboard/RewardsCard";
import SystemNotices from "@/components/dashboard/SystemNotices";
import type { DashboardDTO } from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/lib/theme/copy";

const Dashboard = () => {
  const t = useCopy();
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }
        const payload = (await response.json()) as DashboardDTO;
        if (active) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load");
          setData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const nextBadgeHint = useMemo(() => {
    const next = data?.badges?.locked?.find((badge) => badge.progress);
    if (!next?.progress) return undefined;
    return `${next.progress.current}/${next.progress.target} steps to ${next.name}`;
  }, [data]);

  const cooldownEndsAt = useMemo(() => {
    return data?.actions?.find((action) => action.state === "cooldown")?.cooldownEndsAt;
  }, [data]);

  const hasContent = Boolean(
    data &&
      (data.actions?.length || data.badges?.earned?.length || data.badges?.locked?.length || data.rewards)
  );

  return (
    <PageShell
      spec={{
        page: "dashboard",
        flavor: "default",
        energy: 2,
      }}
    >
      <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardShell>
        {loading && (
          <div className="glass-card p-6 rounded-2xl text-center">
            <p className="text-sm text-muted-foreground">{t('dashboard.loadingBody')}</p>
          </div>
        )}

        {!loading && !hasContent && (
          <div className="glass-card p-8 rounded-2xl text-center space-y-4">
            <h1 className="text-2xl font-bold">{t('dashboard.emptyTitle')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.emptyBody')}
            </p>
            <Button variant="gradient">{t('dashboard.verifyCta')}</Button>
            {error && <p className="text-xs text-muted-foreground">{error}</p>}
          </div>
        )}

        {!loading && hasContent && data && (
          <div className="space-y-8">
            <UserStatusCard
              user={data.user}
              nextBadgeHint={nextBadgeHint}
              cooldownEndsAt={cooldownEndsAt}
            />

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <ActionList actions={data.actions} status={data.user.status} />
              <div className="space-y-6">
                <RewardsCard rewards={data.rewards} />
                <SystemNotices system={data.system} />
              </div>
            </div>

            <BadgeStrip badges={data.badges} />
          </div>
        )}
      </DashboardShell>
      <Footer />
      </div>
    </PageShell>
  );
};

export default Dashboard;
