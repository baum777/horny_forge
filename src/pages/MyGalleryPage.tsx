import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { useCopy } from "@/lib/theme/copy";

export default function MyGalleryPage() {
  const t = useCopy();
  return (
    <PageShell
      spec={{
        page: "my-gallery",
        flavor: "default",
        energy: 1,
        state: "teaser",
      }}
    >
      <TeaserLayout
        title={t('myGallery.title')}
        subtitle={t('myGallery.subtitle')}
      />
    </PageShell>
  );
}

