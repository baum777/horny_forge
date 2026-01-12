import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenStatsProvider } from "lib/hooks/useTokenStats";
import { FloatingImages } from "@/components/FloatingImages";
import { fetchMemePool } from "@/lib/memePool";
import Index from "./pages/Index";
import Interact from "./pages/Interact";
import Legal from "./pages/Legal";
import Archives from "./pages/Archives";
import ArtifactDetail from "./pages/ArtifactDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [transparentImages, setTransparentImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMemePool()
      .then((list) => {
        if (!alive) return;
        setTransparentImages(list);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        console.error("Failed to fetch meme pool:", e);
      });

    return () => {
      alive = false;
    };
  }, []);

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
