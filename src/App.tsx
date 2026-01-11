import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenStatsProvider } from "lib/hooks/useTokenStats";
import { FloatingImages } from "@/components/FloatingImages";
import { initializeTransparentImages, ALL_PNG_IMAGES } from "@/lib/memePool";
import Index from "./pages/Index";
import Interact from "./pages/Interact";
import Legal from "./pages/Legal";
import Archives from "./pages/Archives";
import ArtifactDetail from "./pages/ArtifactDetail";
import Profile from "./pages/Profile";
import GamificationDemo from "./pages/GamificationDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [transparentImages, setTransparentImages] = useState<string[]>(ALL_PNG_IMAGES);

  useEffect(() => {
    // Check which images have transparency on mount
    initializeTransparentImages().then((images) => {
      if (images.length > 0) {
        setTransparentImages(images);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenStatsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" theme="dark" />
          <div className="relative min-h-screen">
            <FloatingImages images={transparentImages} />
            <div className="relative z-10">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/interact" element={<Interact />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/archives" element={<Archives />} />
                  <Route path="/archives/:id" element={<ArtifactDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/gamification" element={<GamificationDemo />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </div>
        </TooltipProvider>
      </TokenStatsProvider>
    </QueryClientProvider>
  );
};

export default App;
