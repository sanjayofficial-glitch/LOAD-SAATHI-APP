import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import AuthSync from "./components/AuthSync";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import TruckerHub from "./pages/trucker/TruckerHub";
import EditTrip from "./pages/trucker/EditTrip";
import TruckerHistory from "./pages/TruckerHistory";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import EditShipment from "./pages/shipper/EditShipment";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import TripDetail from "./pages/TripDetail";
import TruckerTripDetail from "./pages/trucker/TruckerTripDetail";
import ShipperHistory from "./pages/ShipperHistory";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth-sync" element={<AuthSync />} />
              <Route path="/choose-role" element={<ChooseRole />} />
              
              {/* Authenticated Routes - wrapped with Layout */}
              <Route element={
                <Layout>
                  <RoleProtectedRoute allowedRole="both">
                    <Outlet />
                  </RoleProtectedRoute>
                </Layout>
              }>
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
                <Route path="/trucker/my-trips" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHub />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/trips/:tripId/edit" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <EditTrip />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/trips/:tripId" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerTripDetail />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/browse-shipments" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <BrowseShipments />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/my-requests" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHub />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/history" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHistory />
                  </RoleProtectedRoute>
                } />
                
                {/* Shipper Routes */}
                <Route path="/shipper/dashboard" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <ShipperDashboard />
                  </RoleProtectedRoute>
                } />
                <Route path="/shipper/post-shipment" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <PostShipments />
                  </RoleProtectedRoute>
                } />
                <Route path="/shipper/my-shipments" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <MyShipments />
                  </RoleProtectedRoute>
                } />
                <Route path="/shipper/shipments/:id" element={<ShipmentDetail />} />
                <Route path="/shipper/shipments/:shipmentId/edit" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <EditShipment />
                  </RoleProtectedRoute>
                } />
                <Route path="/shipper/history" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <ShipperHistory />
                  </RoleProtectedRoute>
                } />
                <Route path="/browse-trucks" element={
                  <RoleProtectedRoute allowedRole="shipper">
                    <BrowseTrips />
                  </RoleProtectedRoute>
                } />
                
                {/* Common Authenticated Routes */}
                <Route path="/trips/:tripId" element={<TripDetail />} />
                <Route path="/chat/:requestId" element={<Chat />} />
                <Route path="/messages" element={<ChatList />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/browse-shipments" element={<BrowseShipments />} />
                <Route path="/browse-trips" element={<BrowseTrips />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;