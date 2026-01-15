import React from "react";
import Navbar from "@/components/layout/Navbar";

interface TeaserLayoutProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function TeaserLayout({ title, subtitle, children }: TeaserLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center relative z-10 p-4">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-0" />
        
        {/* Content Overlay */}
        <div className="relative z-10 text-center space-y-4 max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

