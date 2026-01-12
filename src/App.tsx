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
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ActionsPage from "./pages/ActionsPage";
import BadgesPage from "./pages/BadgesPage";
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
                  <Route path="/" element={<Index />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/actions" element={<ActionsPage />} />
                  <Route path="/badges" element={<BadgesPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/interact" element={<Interact />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/archives" element={<Archives />} />
                  <Route path="/archives/:id" element={<ArtifactDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/dashboard" element={<Dashboard />} />
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
