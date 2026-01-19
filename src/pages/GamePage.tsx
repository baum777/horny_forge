import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { useCopy } from "@/lib/theme/copy";

export default function GamePage() {
  const t = useCopy();
  return (
    <PageShell
      spec={{
        page: "game",
        flavor: "subtle",
        energy: 1,
        state: "teaser",
      }}
    >
      <TeaserLayout
        title={t('game.title')}
        subtitle={t('game.subtitle')}
      >
        <div className="relative w-full max-w-2xl aspect-video mx-auto mt-8 border-2 border-[#FFE600]/30 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
          {/* Blurred Silhouette */}
          <div className="absolute inset-0 bg-black flex items-center justify-center opacity-50 blur-sm">
             <div className="w-16 h-16 bg-[#FFE600] rounded-full" />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-4">
            <p className="text-[#FFE600] font-mono text-sm uppercase tracking-widest border border-[#FFE600]/50 px-3 py-1 rounded-full">
              {t('game.status')}
            </p>
          </div>
        </div>
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p>{t('errors.auth.connect')}</p>
          <p>{t('errors.auth.session')}</p>
          <p>{t('errors.auth.notVerified')}</p>
        </div>
      </TeaserLayout>
    </PageShell>
  );
}


