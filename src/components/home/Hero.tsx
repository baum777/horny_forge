import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { LiveTicker } from './LiveTicker';
import { SocialGroup } from '@/components/ui/SocialGroup';
import { ContractAddress } from '@/components/ui/ContractAddress';
import { copyContent } from '@/lib/content';

export default function Hero() {
  const scrollToInteract = () => {
    const el = document.getElementById('interact-preview');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col pt-16 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden bg-[#0B0B0B]">
        {/* Subtle Radial Glow - Static/Calm */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#FFE600]/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#FFE600]" />
            <span className="text-sm font-medium text-[#FFE600] tracking-wide">The Playground is Open</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-white">
            {copyContent.landing.hero.headline}
          </h1>

          {/* Subline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            {copyContent.landing.hero.subline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="text-lg px-8 w-full sm:w-auto bg-[#FFE600] text-black hover:bg-[#FFE600]/90 font-bold border-none"
            >
              {copyContent.landing.marketingMini.ctaPrimary}
            </Button>
            <Link to="/gallery">
              <Button
                variant="outline"
                size="lg"
                className="text-lg w-full sm:w-auto border-white/20 hover:bg-white/5 hover:text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {copyContent.landing.marketingMini.ctaSecondary}
              </Button>
            </Link>
          </div>

          {/* Trust Microcopy */}
          <div className="flex items-center justify-center gap-6 text-xs md:text-sm text-muted-foreground mb-12">
            {copyContent.landing.hero.trust.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          {/* Socials & CA */}
          <div className="flex flex-col items-center gap-8">
            <SocialGroup />
            <ContractAddress />
          </div>

        </motion.div>
        </div>
      </div>

      {/* LiveTicker */}
      <div className="relative z-20 mt-auto">
        <LiveTicker />
      </div>
    </section>
  );
}

