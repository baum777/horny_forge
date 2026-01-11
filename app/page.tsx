"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Zap, Archive, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenPulseStrip } from "@/components/token/TokenPulseStrip";
import NavBar from "@/components/nav/NavBar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <NavBar />
      
      {/* Token Pulse Strip */}
      <div className="pt-16">
        <TokenPulseStrip />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
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
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">THE HORNY ARCHIVES</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
              <span className="text-gradient">$HORNY</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              A living record of collective desire. <span className="text-primary font-semibold">Infuse. Vote. Ascend.</span>
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Enter THE HORNY ARCHIVES. Forge legendary memes. Join the ritual.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/archives">
                <Button variant="gradient" size="lg" className="text-lg px-8">
                  <Archive className="w-5 h-5 mr-2" />
                  EXPLORE ARCHIVES
                </Button>
              </Link>
              <Link href="/forge">
                <Button variant="outline" size="lg" className="text-lg">
                  <Hammer className="w-5 h-5 mr-2" />
                  META FORGE
                </Button>
              </Link>
            </div>

            {/* Community Link */}
            <div className="mt-8">
              <a
                href={process.env.NEXT_PUBLIC_X_COMMUNITY_URL || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Zap className="w-4 h-4" />
                Join the X Community
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

