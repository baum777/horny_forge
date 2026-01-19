import { motion } from 'framer-motion';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { useCopy } from '@/lib/theme/copy';

const loreChapters = [
  {
    id: 1,
    titleKey: 'home.lore.chapters.1.title',
    icon: '🌅',
    descriptionKey: 'home.lore.chapters.1.description',
    color: 'from-pink-500/20 to-transparent',
  },
  {
    id: 2,
    titleKey: 'home.lore.chapters.2.title',
    icon: '🧬',
    descriptionKey: 'home.lore.chapters.2.description',
    color: 'from-red-500/20 to-transparent',
  },
  {
    id: 3,
    titleKey: 'home.lore.chapters.3.title',
    icon: '🚀',
    descriptionKey: 'home.lore.chapters.3.description',
    color: 'from-yellow-500/20 to-transparent',
  },
];

export default function LoreSection() {
  const t = useCopy();
  return (
    <section id="lore" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            {t('home.lore.titlePrefix')} <span className="text-gradient">{t('home.lore.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('home.lore.subtitle')}
          </p>
        </motion.div>

        {/* Chapters */}
        <div className="grid md:grid-cols-3 gap-6">
          {loreChapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <GlassCard 
                variant="neon" 
                className={`h-full relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${chapter.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <GlassCardHeader className="relative">
                  <div className="text-4xl mb-4">{chapter.icon}</div>
                  <p className="text-xs font-semibold text-primary mb-2">
                    {t('home.lore.chapterLabel', { index: chapter.id })}
                  </p>
                  <GlassCardTitle className="text-xl">{t(chapter.titleKey)}</GlassCardTitle>
                </GlassCardHeader>
                
                <GlassCardContent className="relative">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(chapter.descriptionKey)}
                  </p>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Teaser */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-muted-foreground italic"
        >
        {t('home.lore.teaser')}
        </motion.p>
      </div>
    </section>
  );
}
