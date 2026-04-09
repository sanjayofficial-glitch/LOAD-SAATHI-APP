"use client";

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import AuthSync from "./components/AuthSync";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import NotFound from "./pages/NotFound";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Shipper Pages
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import EditShipment from "./pages/shipper/EditShipment";
import ShipperHistory from "./pages/ShipperHistory";

// Trucker Pages
import TruckerDashboard from "./pages/trucker/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import MyTrips from "./pages/trucker/MyTrips";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import EditTrip from "./pages/trucker/EditTrip";
import TruckerHistory from "./pages/TruckerHistory";

// Shared Pages
import TripDetail from "./pages/TripDetail";

const CLERK_PUBLISHABLE_KEY = "pk_test_Y29tcGFjdC1tYW1tb3RoLTU4LmNsZXJrLmFjY291bnRzLmRldiQ";

const AppLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

const App = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Auth Sync & Role Selection */}
            <Route path="/auth-sync" element={<AuthSync />} />
            <Route path="/choose-role" element={<ChooseRole />} />

            {/* Protected Routes with Layout */}
            <Route element={<AppLayout />}>
              <Route path="/profile" element={<RoleProtectedRoute allowedRole="both"><Profile /></RoleProtectedRoute>} />
              <Route path="/messages" element={<RoleProtectedRoute allowedRole="both"><ChatList /></RoleProtectedRoute>} />
              <Route path="/chat/:requestId" element={<RoleProtectedRoute allowedRole="both"><Chat /></RoleProtectedRoute>} />
              <Route path="/trips/:tripId" element={<RoleProtectedRoute allowedRole="both"><TripDetail /></RoleProtectedRoute>} />

              {/* Shipper Routes */}
              <Route path="/shipper/dashboard" element={<RoleProtectedRoute allowedRole="shipper"><ShipperDashboard /></RoleProtectedRoute>} />
              <Route path="/shipper/post-shipment" element={<RoleProtectedRoute allowedRole="shipper"><PostShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/my-shipments" element={<RoleProtectedRoute allowedRole="shipper"><MyShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:id" element={<RoleProtectedRoute allowedRole="shipper"><ShipmentDetail /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:shipmentId/edit" element={<RoleProtectedRoute allowedRole="shipper"><EditShipment /></RoleProtectedRoute>} />
              <Route path="/shipper/history" element={<RoleProtectedRoute allowedRole="shipper"><ShipperHistory /></RoleProtectedRoute>} />
              <Route path="/browse-trucks" element={<RoleProtectedRoute allowedRole="shipper"><BrowseTrips /></RoleProtectedRoute>} />

              {/* Trucker Routes */}
              <Route path="/trucker/dashboard" element={<RoleProtectedRoute allowedRole="trucker"><TruckerDashboard /></RoleProtectedRoute>} />
              <Route path="/trucker/post-trip" element={<RoleProtectedRoute allowedRole="trucker"><PostTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/my-trips" element={<RoleProtectedRoute allowedRole="trucker"><MyTrips /></RoleProtectedRoute>} />
              <Route path="/trucker/trips/:tripId/edit" element={<RoleProtectedRoute allowedRole="trucker"><EditTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/browse-shipments" element={<RoleProtectedRoute allowedRole="trucker"><BrowseShipments /></RoleProtectedRoute>} />
              <Route path="/trucker/history" element={<RoleProtectedRoute allowedRole="trucker"><TruckerHistory /></RoleProtectedRoute>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ClerkProvider>
  );
};

export default App;