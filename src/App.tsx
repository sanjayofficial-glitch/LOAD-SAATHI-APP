import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import MissingClerkKey from "@/components/MissingClerkKey";

import Index from "./pages/Index";
// ... other imports remain the same ...

// Create a query client instance
const queryClient = new QueryClient();

// Define a simple loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
  </div>
);

const App = () => {
  // Check if we have a valid Clerk publishable key
  const hasValidClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.length;
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <AuthProvider>
          {hasValidClerkKey ? (
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* ... existing routes ... */}
              </Routes>
            </Suspense>
          ) : (
            <MissingClerkKey />
          )}
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;