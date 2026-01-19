import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Palette, Trophy, ArrowRight } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/lib/theme/copy';

const features = [
  {
    id: 'meta-forge',
    titleKey: 'home.interact.features.generator.title',
    descriptionKey: 'home.interact.features.generator.description',
    icon: Palette,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    id: 'badges',
    titleKey: 'home.interact.features.badges.title',
    descriptionKey: 'home.interact.features.badges.description',
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

export default function InteractPreview() {
  const t = useCopy();
  return (
    <section id="interact-preview" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            <span className="text-gradient">{t('home.interact.titleAccent')}</span>{' '}
            {t('home.interact.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('home.interact.subtitle')}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/interact#${feature.id}`}>
                <GlassCard className="h-full group hover:border-primary/50 transition-all duration-300 cursor-pointer">
                  <GlassCardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <GlassCardTitle className="flex items-center gap-2">
                      {t(feature.titleKey)}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </GlassCardTitle>
                    <GlassCardDescription>{t(feature.descriptionKey)}</GlassCardDescription>
                  </GlassCardHeader>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/interact">
            <Button variant="gradient" size="lg">
              {t('home.interact.cta')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
