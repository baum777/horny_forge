import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const scrollToInteract = () => {
    const el = document.getElementById('interact-preview');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[100px] opacity-30"
          animate={{
            background: [
              'radial-gradient(ellipse at 20% 30%, hsl(330 100% 71% / 0.4) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 70%, hsl(0 100% 50% / 0.4) 0%, transparent 50%)',
              'radial-gradient(ellipse at 50% 50%, hsl(330 100% 71% / 0.4) 0%, transparent 50%)',
              'radial-gradient(ellipse at 20% 30%, hsl(330 100% 71% / 0.4) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Animated streaks */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent"
            style={{
              top: `${20 + i * 15}%`,
              left: '-100%',
              width: '200%',
            }}
            animate={{
              x: ['0%', '50%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Meta is Here</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
            <span className="text-gradient">$HORNY</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Enter the <span className="text-primary font-semibold">Horny Meta Universe</span>
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Where desire meets gains. Scan your horny level. Forge memes. Join the ritual.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/game">
              <Button
                variant="gradient"
                size="lg"
                className="text-lg px-8 w-full sm:w-auto"
              >
                <Zap className="w-5 h-5 mr-2" />
                PLAY CYBER RUNNER
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToInteract}
              className="text-lg w-full sm:w-auto"
            >
              Enter Hub
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">69K+</p>
              <p className="text-sm text-muted-foreground">Holders</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-accent">420%</p>
              <p className="text-sm text-muted-foreground">ATH Gains</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-secondary">∞</p>
              <p className="text-sm text-muted-foreground">Desire</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-primary" />
        </div>
      </motion.div>
    </section>
  );
}
