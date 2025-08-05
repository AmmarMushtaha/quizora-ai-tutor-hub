import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen w-full">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/history" element={<History />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
