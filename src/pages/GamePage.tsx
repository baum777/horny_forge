import { PageShell } from "@/components/layout/PageShell";
import { TeaserLayout } from "@/components/ui/TeaserLayout";
import { copyContent } from "@/lib/content";

export default function GamePage() {
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
        title="$Horny RUNNER"
        subtitle="$Horny Runner unlocking soon"
      >
        <div className="relative w-full max-w-2xl aspect-video mx-auto mt-8 border-2 border-[#FFE600]/30 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
          {/* Blurred Silhouette */}
          <div className="absolute inset-0 bg-black flex items-center justify-center opacity-50 blur-sm">
             <div className="w-16 h-16 bg-[#FFE600] rounded-full animate-pulse" />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-4">
             <p className="text-[#FFE600] font-mono text-sm uppercase tracking-widest border border-[#FFE600]/50 px-3 py-1 rounded-full">
               System Initializing
             </p>
          </div>
        </div>
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p>{copyContent.errors.auth.connect}</p>
          <p>{copyContent.errors.auth.session}</p>
          <p>{copyContent.errors.auth.notVerified}</p>
        </div>
      </TeaserLayout>
    </PageShell>
  );
}


