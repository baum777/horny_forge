import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { useCopy } from "@/lib/theme/copy";

export default function QuestsPage() {
  const t = useCopy();
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
        title={t('questsPage.title')}
        subtitle={t('questsPage.subtitle')}
      />
    </PageShell>
  );
}

