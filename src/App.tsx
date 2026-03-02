import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Editor from "./pages/Editor";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import PresentationMode from "./pages/PresentationMode";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/editor/:id" element={<ErrorBoundary><Editor /></ErrorBoundary>} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<Auth />} />
            <Route path="/present" element={<ErrorBoundary><PresentationMode /></ErrorBoundary>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
