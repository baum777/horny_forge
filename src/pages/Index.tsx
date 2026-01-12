import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import LoreSection from '@/components/home/LoreSection';
import InteractPreview from '@/components/home/InteractPreview';
import LiveTicker from '@/components/features/LiveTicker';
import HornyMeter from '@/components/features/HornyMeter';
import MemeBackground from '@/components/MemeBackground';
import { addSectionVisited, unlockBadge } from '@/lib/storage';
import MemeBackground from '@/components/MemeBackground';

export default function Index() {
  useEffect(() => {
    // Track section visits for badge
    const sections = ['hero', 'lore', 'interact-preview', 'fomo'];
    
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MemeBackground count={9} spawnEveryMs={850} />
      {/* Background noise texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
      <MemeBackground />

      <Navbar />
      
      <main>
        <div id="hero">
          <Hero />
        </div>
        
        <div id="fomo">
          <LiveTicker />
        </div>
        
        <LoreSection />
        
        <InteractPreview />
        
        <div id="badges" className="py-12">
          {/* Badges section teaser handled in InteractPreview */}
        </div>
      </main>

      <Footer />
      
      <HornyMeter />
    </div>
  );
}
