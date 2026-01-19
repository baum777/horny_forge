import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { useCopy } from "@/lib/theme/copy";

export default function BadgesPage() {
  const t = useCopy();
  return (
    <PageShell
      spec={{
        page: "badges",
        flavor: "desaturated",
        energy: 1,
        state: "locked",
      }}
    >
      <TeaserLayout
        title={t('badgesPage.title')}
        subtitle={t('badgesPage.subtitle')}
      >
        <div className="mt-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 opacity-30 blur-sm pointer-events-none select-none">
          {/* Visual Placeholder for blurred badges */}
          {[...Array(12)].map((_, i) => (
             <div key={i} className="aspect-square rounded-full bg-white/10 border border-white/5" />
          ))}
        </div>
      </TeaserLayout>
    </PageShell>
  );
}


