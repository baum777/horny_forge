import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokenStatsProvider } from "@/hooks/useTokenStats";
import Index from "./pages/Index";
import Interact from "./pages/Interact";
import Legal from "./pages/Legal";
import Archives from "./pages/Archives";
import ArtifactDetail from "./pages/ArtifactDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TokenStatsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" theme="dark" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/interact" element={<Interact />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/archives/:id" element={<ArtifactDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TokenStatsProvider>
  </QueryClientProvider>
);

export default App;
