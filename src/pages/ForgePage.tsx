import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { useCopy } from "@/lib/theme/copy";

export default function ForgePage() {
  const t = useCopy();
  return (
    <PageShell
      spec={{
        page: "forge",
        flavor: "default",
        energy: 2,
        state: "teaser",
      }}
    >
      <TeaserLayout
        title={t('forgePage.title')}
        subtitle={t('forgePage.subtitle')}
      />
    </PageShell>
  );
}

