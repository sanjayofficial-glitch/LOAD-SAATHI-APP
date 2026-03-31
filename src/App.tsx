"use client";

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Truck, Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton, SignOutButton } from "@clerk/react";

// Eager load core pages for faster transitions
import Index from "./pages/Index";
import Login from "./pages/Login";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";

// Lazy load secondary pages
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import PostTrip from "./pages/trucker/PostTrip";
import EditTrip from "./pages/trucker/EditTrip";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import TripDetail from "./pages/TripDetail";
import MyTrips from "./pages/trucker/MyTrips";
import MyShipments from "./pages/shipper/MyShipments";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import TestAuth from "./pages/TestAuth";
import PostShipments from "./pages/shipper/PostShipments";
import EditShipment from "./pages/shipper/EditShipment";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import MyShipmentRequests from "./pages/trucker/MyShipmentRequests";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <Loader2 className="h-10 w-10 text-orange-600 animate-spin mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Loading LoadSaathi...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedTypes }: { children: React.ReactNode, allowedTypes?: ('trucker' | 'shipper')[] }) => {
  const { userProfile, loading } = useAuth();

  if (loading) return <LoadingFallback />;

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(userProfile.user_type)) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} replace />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <header className="border-b bg-white p-4 flex justify-between items-center container mx-auto">
              <div className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-orange-600" />
                <span className="font-bold text-lg">LoadSaathi</span>
              </div>
              <SignedOut>
                <div className="flex gap-2">
                  <SignInButton />
                  <SignUpButton />
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton />
                  <SignOutButton className="text-sm text-gray-600 hover:text-gray-900" />
                </div>
              </SignedIn>
            </header>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/test-auth" element={<TestAuth />} />
              {/* Trucker Routes */}
              <Route path="/trucker/dashboard" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <TruckerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/trucker/post-trip" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <PostTrip />
                </ProtectedRoute>
              } />
              <Route path="/trucker/edit-trip/:id" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <EditTrip />
                </ProtectedRoute>
              } />
              <Route path="/trucker/my-trips" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <MyTrips />
                </ProtectedRoute>
              } />
              <Route path="/trucker/browse-shipments" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <BrowseShipments />
                </ProtectedRoute>
              } />
              <Route path="/trucker/my-requests" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <MyShipmentRequests />
                </ProtectedRoute>
              } />
              
              {/* Shipper Routes */}
              <Route path="/shipper/dashboard" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <ShipperDashboard />
                </ProtectedRoute>
              } />
              <Route path="/shipper/post-shipment" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <PostShipments />
                </ProtectedRoute>
              } />
              <Route path="/shipper/edit-shipment/:id" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <EditShipment />
                </ProtectedRoute>
              } />
              <Route path="/browse-trucks" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <BrowseTrips />
                </ProtectedRoute>
              } />
              <Route path="/shipper/my-shipments" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <MyShipments />
                </ProtectedRoute>
              } />
              <Route path="/shipments/:id" element={
                <ProtectedRoute allowedTypes={['shipper']}>
                  <ShipmentDetail />
                </ProtectedRoute>
              } />
              
              {/* Shared Routes */}
              <Route path="/trips/:id" element={
                <ProtectedRoute>
                  <TripDetail />
                </ProtectedRoute>
              } />
              <Route path="/chat/:requestId" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <ChatList />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedTypes={['trucker']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;