import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";

export default function MyGalleryPage() {
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
        title="Your collection is loading..."
        subtitle="Drafts. Published. Hidden."
      />
    </PageShell>
  );
}

