import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthSync from "./components/AuthSync";
import ChooseRole from "./pages/ChooseRole";
import TruckerDashboard from "./pages/trucker/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import TruckerHub from "./pages/trucker/TruckerHub";
import EditTrip from "./pages/trucker/EditTrip";
import TruckerTripDetail from "./pages/trucker/TruckerTripDetail";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import TruckerHistory from "./pages/trucker/TruckerHistory";
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import EditShipment from "./pages/shipper/EditShipment";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import TripDetail from "./pages/TripDetail";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth-sync" element={<AuthSync />} />
              <Route path="/choose-role" element={<ChooseRole />} />

              {/* Authenticated routes wrapped with Layout */}
              <Route
                element={
                  <Layout>
                    <RoleProtectedRoute allowedRole="both">
                      <Outlet />
                    </RoleProtectedRoute>
                  </Layout>
                }
              >
                {/* Trucker routes */}
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
                <Route path="/trucker/history" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHistory />
                  </RoleProtectedRoute>
                } />

                {/* Shipper routes */}
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
                <Route path="/browse-trucks" element={<BrowseTrips />} />

                {/* Common authenticated routes */}
                <Route path="/trips/:tripId" element={<TripDetail />} />
                <Route path="/chat/:requestId" element={<Chat />} />
                <Route path="/messages" element={<ChatList />} />
                <Route path="/profile" element={<Profile />} />

                {/* Catch‑all */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;