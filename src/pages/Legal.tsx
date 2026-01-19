import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCopy } from '@/lib/theme/copy';

export default function Legal() {
  const t = useCopy();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/">
              <Button variant="ghost" className="mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('legal.back')}
              </Button>
            </Link>

            <h1 className="text-4xl font-black mb-8">
              <span className="text-gradient">{t('legal.title')}</span>
            </h1>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.general.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.general.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.investment.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.investment.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.risk.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.risk.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.nfa.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.nfa.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.privacy.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.privacy.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.links.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.links.body')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">{t('legal.sections.contact.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.sections.contact.body')}
                </p>
              </section>

              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  {t('legal.lastUpdated', { date: new Date().toLocaleDateString() })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
