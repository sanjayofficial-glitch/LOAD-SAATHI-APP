"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/sonner";

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ChooseRole from './pages/ChooseRole';
import AuthSync from './components/AuthSync';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import NotFound from './pages/NotFound';

// Shipper Pages
import ShipperDashboard from './pages/shipper/Dashboard';
import PostShipments from './pages/shipper/PostShipments';
import MyShipments from './pages/shipper/MyShipments';
import ShipmentDetail from './pages/shipper/ShipmentDetail';
import EditShipment from './pages/shipper/EditShipment';
import BrowseTrips from './pages/shipper/BrowseTrips';
import ShipperHistory from './pages/shipper/ShipperHistory';

// Trucker Pages
import TruckerDashboard from './pages/trucker/Dashboard';
import PostTrip from './pages/trucker/PostTrip';
import TruckerHub from './pages/trucker/TruckerHub';
import TruckerTripDetail from './pages/trucker/TruckerTripDetail';
import EditTrip from './pages/trucker/EditTrip';
import BrowseShipments from './pages/trucker/BrowseShipments';
import TruckerHistory from './pages/trucker/TruckerHistory';

// Admin Pages
import MonitoringDashboard from './pages/admin/MonitoringDashboard';

// Components
import Layout from './components/Layout';
import RoleProtectedRoute from './components/RoleProtectedRoute';

const queryClient = new QueryClient();
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const App = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth-sync" element={<AuthSync />} />
              <Route path="/choose-role" element={<ChooseRole />} />

              {/* Protected Routes with Layout */}
              <Route element={<Layout><RoleProtectedRoute allowedRole="both"><div>Protected Content</div></RoleProtectedRoute></Layout>}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<ChatList />} />
                <Route path="/chat/:requestId" element={<Chat />} />
              </Route>

              {/* Shipper Routes */}
              <Route path="/shipper" element={<Layout><RoleProtectedRoute allowedRole="shipper"><div>Shipper Area</div></RoleProtectedRoute></Layout>}>
                <Route path="dashboard" element={<ShipperDashboard />} />
                <Route path="post-shipment" element={<PostShipments />} />
                <Route path="my-shipments" element={<MyShipments />} />
                <Route path="shipments/:id" element={<ShipmentDetail />} />
                <Route path="shipments/:shipmentId/edit" element={<EditShipment />} />
                <Route path="history" element={<ShipperHistory />} />
              </Route>
              <Route path="/browse-trucks" element={<Layout><RoleProtectedRoute allowedRole="shipper"><BrowseTrips /></RoleProtectedRoute></Layout>} />
              <Route path="/trips/:tripId" element={<Layout><RoleProtectedRoute allowedRole="shipper"><TruckerTripDetail /></RoleProtectedRoute></Layout>} />

              {/* Trucker Routes */}
              <Route path="/trucker" element={<Layout><RoleProtectedRoute allowedRole="trucker"><div>Trucker Area</div></RoleProtectedRoute></Layout>}>
                <Route path="dashboard" element={<TruckerDashboard />} />
                <Route path="post-trip" element={<PostTrip />} />
                <Route path="my-trips" element={<TruckerHub />} />
                <Route path="trips/:tripId" element={<TruckerTripDetail />} />
                <Route path="trips/:tripId/edit" element={<EditTrip />} />
                <Route path="browse-shipments" element={<BrowseShipments />} />
                <Route path="history" element={<TruckerHistory />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/monitoring" element={<RoleProtectedRoute allowedRole="admin"><MonitoringDashboard /></RoleProtectedRoute>} />

              {/* Fallback */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Router>
          <Toaster position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;