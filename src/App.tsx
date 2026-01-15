import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenStatsProvider } from "lib/hooks/useTokenStats";
import { gamificationDemoEnabled } from "@/lib/gamificationFlags";
import {
  Index,
  Interact,
  Legal,
  Archives,
  ArtifactDetail,
  Profile,
  GamificationDemo,
  Dashboard,
  NotFound,
} from "./pages";
// New Pages
import ForgePage from "./pages/ForgePage";
import QuestsPage from "./pages/QuestsPage";
import MyGalleryPage from "./pages/MyGalleryPage";
import GamePage from "./pages/GamePage";
import BadgesPage from "./pages/BadgesPage";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ActionsPage from "./pages/ActionsPage";
import RewardsPage from "./pages/RewardsPage";
import StatusPage from "./pages/StatusPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TokenStatsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" theme="dark" />
          <div className="relative min-h-screen">
            <div className="relative z-10">
              <BrowserRouter>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Index />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/status" element={<StatusPage />} />
                  
                  {/* Feature Teasers / Locked */}
                  <Route path="/forge" element={<ForgePage />} />
                  <Route path="/quests" element={<QuestsPage />} />
                  <Route path="/my-gallery" element={<MyGalleryPage />} />
                  <Route path="/game" element={<GamePage />} />
                  <Route path="/badges" element={<BadgesPage />} />

                  {/* Core App */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/gallery" element={<Archives />} />
                  <Route path="/gallery/:id" element={<ArtifactDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/interact" element={<Interact />} />

                  {/* Legacy / Dev / Other */}
                  <Route path="/actions" element={<ActionsPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/archives" element={<Archives />} />
                  <Route path="/archives/:id" element={<ArtifactDetail />} />
                  
                  {gamificationDemoEnabled && (
                    <Route path="/gamification" element={<GamificationDemo />} />
                  )}
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

