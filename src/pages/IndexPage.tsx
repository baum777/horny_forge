import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import LoreSection from '@/components/home/LoreSection';
import InteractPreview from '@/components/home/InteractPreview';
import EnergyMeter from '@/components/features/EnergyMeter';
import SurfaceBackground from '@/components/SurfaceBackground';
import { addSectionVisited, unlockBadge } from '@/lib/storage';
import { PageShell } from '@/components/layout/PageShell';

export default function Index() {
  useEffect(() => {
    // Track section visits for badge
    const sections = ['hero', 'lore', 'interact-preview'];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            addSectionVisited(sectionId);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <PageShell
      spec={{
        page: "home",
        flavor: "default",
        energy: 2,
      }}
    >
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SurfaceBackground count={9} spawnEveryMs={850} />
        {/* Background noise texture */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.015]">
          <svg className="w-full h-full">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>
        <SurfaceBackground />

        <Navbar />
        
        <main>
          <div id="hero">
            <Hero />
          </div>
          
          <LoreSection />
          
          <InteractPreview />
          
          <div id="badges" className="py-12">
            {/* Badges section teaser handled in InteractPreview */}
          </div>
        </main>

        <Footer />
        
        <EnergyMeter />
      </div>
    </PageShell>
  );
}
