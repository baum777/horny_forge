import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";

export default function ForgePage() {
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
        title="The Forge is warming up."
        subtitle="Create. Remix. Win."
      />
    </PageShell>
  );
}

