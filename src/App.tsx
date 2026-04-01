import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkAuthProvider, useClerk } from "@/contexts/ClerkContext";
import Layout from "@/components/Layout";
import { Truck, Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Eager load core pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole"; // 👈 New import
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";

// Lazy load secondary pages
... (rest unchanged) ...

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <ClerkAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/choose-role" element={<ChooseRole />} /> // 👈 New route
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              
              {/* Trucker Routes */}
              <Route path="/trucker/dashboard" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <TruckerDashboard />
                </ProtectedRoute>
              } />
              ... (rest unchanged) ...
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ClerkAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;