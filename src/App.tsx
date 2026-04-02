"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ChooseRole from "@/pages/ChooseRole";
import ShipperDashboard from "@/pages/shipper/Dashboard";
import TruckerDashboard from "@/pages/trucker/Dashboard";
import PostTrip from "@/pages/trucker/PostTrip";
import BrowseShipments from "@/pages/trucker/BrowseShipments";
import MyTrips from "@/pages/trucker/MyTrips";
import MyRequests from "@/pages/trucker/MyShipmentRequests";
import TruckerHistory from "@/pages/TruckerHistory";
import ShipperHistory from "@/pages/ShipperHistory";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import AuthSync from "@/components/AuthSync";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AuthSync />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            
            {/* Shipper Routes */}
            <Route path="/shipper/dashboard" element={
              <RoleProtectedRoute allowedRole="shipper">
                <ShipperDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/shipper/history" element={
              <RoleProtectedRoute allowedRole="shipper">
                <ShipperHistory />
              </RoleProtectedRoute>
            } />
            
            {/* Trucker Routes */}
            <Route path="/trucker/dashboard" element={
              <RoleProtectedRoute allowedRole="trucker">
                <TruckerDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/trucker/post-trip" element={
              <RoleProtectedRoute allowedRole="trucker">
                <PostTrip />
              </RoleProtectedRoute>
            } />
            <Route path="/trucker/browse-shipments" element={
              <RoleProtectedRoute allowedRole="trucker">
                <BrowseShipments />
              </RoleProtectedRoute>
            } />
            <Route path="/trucker/my-trips" element={
              <RoleProtectedRoute allowedRole="trucker">
                <MyTrips />
              </RoleProtectedRoute>
            } />
            <Route path="/trucker/my-requests" element={
              <RoleProtectedRoute allowedRole="trucker">
                <MyRequests />
              </RoleProtectedRoute>
            } />
            <Route path="/trucker/history" element={
              <RoleProtectedRoute allowedRole="trucker">
                <TruckerHistory />
              </RoleProtectedRoute>
            } />
            
            {/* Common Routes */}
            <Route path="/profile" element={
              <RoleProtectedRoute allowedRole="both">
                <Profile />
              </RoleProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;