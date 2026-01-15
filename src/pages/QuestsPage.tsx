import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";

export default function QuestsPage() {
  return (
    <PageShell
      spec={{
        page: "quests",
        flavor: "subtle",
        energy: 1,
        state: "teaser",
      }}
    >
      <TeaserLayout
        title="Weekly Quests starting soon."
        subtitle="First come, first served. Real rewards."
      />
    </PageShell>
  );
}

