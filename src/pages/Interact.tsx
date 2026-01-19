import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Palette, Trophy } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EnergyMeter from '@/components/features/EnergyMeter';
import MetaForge from '@/components/MetaForge/MetaForge';
import Badges from '@/components/features/Badges';
import { addSectionVisited, unlockBadge, getVisitData } from '@/lib/storage';
import { PageShell } from '@/components/layout/PageShell';
import { useCopy } from '@/lib/theme/copy';

const sections = [
  { id: 'meta-forge', titleKey: 'interact.sections.generator.title', icon: Palette, descriptionKey: 'interact.sections.generator.description' },
  { id: 'badges', titleKey: 'interact.sections.badges.title', icon: Trophy, descriptionKey: 'interact.sections.badges.description' },
];

export default function Interact() {
  const t = useCopy();
  const location = useLocation();

  useEffect(() => {
    // Scroll to hash on load
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  useEffect(() => {
    // Track section visits
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            addSectionVisited(entry.target.id);
            
            // Check if all sections visited
            const allSections = ['meta-forge', 'badges', 'hero', 'lore', 'interact-preview'];
            const visitData = getVisitData();
            const visitedAll = allSections.every(s => visitData.sectionsVisited.includes(s));
            if (visitedAll) {
              unlockBadge('all-sections');
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <PageShell
      spec={{
        page: "interact",
        flavor: "subtle",
        energy: 2,
      }}
    >
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 pb-16">
        {/* Header */}
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              <span className="text-gradient">{t('interact.title')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('interact.subtitle')}
            </p>
          </motion.div>

          {/* Quick nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-primary/20 transition-colors"
              >
                <section.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t(section.titleKey)}</span>
              </a>
            ))}
          </motion.div>
        </div>

        {/* Sections */}
        <div className="space-y-24">
          {/* Meta Forge */}
          <section id="meta-forge" className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{t('interact.sections.generator.title')}</h2>
                  <p className="text-muted-foreground">{t('interact.sections.generator.description')}</p>
                </div>
              </div>
              <MetaForge />
            </motion.div>
          </section>

          {/* Badges */}
          <section id="badges" className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{t('interact.sections.badges.title')}</h2>
                  <p className="text-muted-foreground">{t('interact.sections.badges.description')}</p>
                </div>
              </div>
              <Badges />
            </motion.div>
          </section>
        </div>
      </main>

      <Footer />
      <EnergyMeter />
    </div>
  </PageShell>
  );
}
