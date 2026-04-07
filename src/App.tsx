import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

// Public pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ChooseRole from "@/pages/ChooseRole";
import AuthSync from "@/components/AuthSync";
import NotFound from "@/pages/NotFound";

// Protected pages
const Profile        = lazy(() => import("@/pages/Profile"));
const Chat           = lazy(() => import("@/pages/Chat"));
const ChatList       = lazy(() => import("@/pages/ChatList"));
const ShipperHistory = lazy(() => import("@/pages/ShipperHistory"));
const TruckerHistory = lazy(() => import("@/pages/TruckerHistory"));
const TripDetail     = lazy(() => import("@/pages/TripDetail"));

// Shipper pages
const ShipperDashboard = lazy(() => import("@/pages/shipper/Dashboard"));
const BrowseTrips      = lazy(() => import("@/pages/shipper/BrowseTrips"));
const PostShipments    = lazy(() => import("@/pages/shipper/PostShipments"));
const MyShipments      = lazy(() => import("@/pages/shipper/MyShipments"));
const EditShipment     = lazy(() => import("@/pages/shipper/EditShipment"));
const ShipmentDetail   = lazy(() => import("@/pages/shipper/ShipmentDetail"));

// Trucker pages
const TruckerDashboard = lazy(() => import("@/pages/trucker/Dashboard"));
const PostTrip         = lazy(() => import("@/pages/trucker/PostTrip"));
const BrowseShipments  = lazy(() => import("@/pages/trucker/BrowseShipments"));
const MyTrips          = lazy(() => import("@/pages/trucker/MyTrips"));
const EditTrip         = lazy(() => import("@/pages/trucker/EditTrip"));

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
  </div>
);

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"            element={<Index />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/auth-sync"   element={<AuthSync />} />

              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/trucker/dashboard" element={
                  <RoleProtectedRoute allowedRole="trucker"><TruckerDashboard /></RoleProtectedRoute>
                } />
                <Route path="/trucker/post-trip" element={
                  <RoleProtectedRoute allowedRole="trucker"><PostTrip /></RoleProtectedRoute>
                } />
                <Route path="/trucker/browse-shipments" element={
                  <RoleProtectedRoute allowedRole="trucker"><BrowseShipments /></RoleProtectedRoute>
                } />
                <Route path="/trucker/my-trips" element={
                  <RoleProtectedRoute allowedRole="trucker"><MyTrips /></RoleProtectedRoute>
                } />
                <Route path="/trucker/history" element={
                  <RoleProtectedRoute allowedRole="trucker"><TruckerHistory /></RoleProtectedRoute>
                } />
                <Route path="/trucker/trips/:tripId/edit" element={
                  <RoleProtectedRoute allowedRole="trucker"><EditTrip /></RoleProtectedRoute>
                } />

                <Route path="/shipper/dashboard" element={
                  <RoleProtectedRoute allowedRole="shipper"><ShipperDashboard /></RoleProtectedRoute>
                } />
                <Route path="/shipper/history" element={
                  <RoleProtectedRoute allowedRole="shipper"><ShipperHistory /></RoleProtectedRoute>
                } />
                <Route path="/shipper/post-shipment" element={
                  <RoleProtectedRoute allowedRole="shipper"><PostShipments /></RoleProtectedRoute>
                } />
                <Route path="/shipper/my-shipments" element={
                  <RoleProtectedRoute allowedRole="shipper"><MyShipments /></RoleProtectedRoute>
                } />
                <Route path="/shipper/shipments/:shipmentId/edit" element={
                  <RoleProtectedRoute allowedRole="shipper"><EditShipment /></RoleProtectedRoute>
                } />
                <Route path="/shipper/shipments/:shipmentId" element={
                  <RoleProtectedRoute allowedRole="shipper"><ShipmentDetail /></RoleProtectedRoute>
                } />
                <Route path="/browse-trucks" element={
                  <RoleProtectedRoute allowedRole="shipper"><BrowseTrips /></RoleProtectedRoute>
                } />
                <Route path="/trips/:tripId" element={
                  <RoleProtectedRoute allowedRole="shipper"><TripDetail /></RoleProtectedRoute>
                } />

                <Route path="/profile" element={
                  <RoleProtectedRoute allowedRole="both"><Profile /></RoleProtectedRoute>
                } />
                <Route path="/messages" element={
                  <RoleProtectedRoute allowedRole="both"><ChatList /></RoleProtectedRoute>
                } />
                <Route path="/chat/:requestId" element={
                  <RoleProtectedRoute allowedRole="both"><Chat /></RoleProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
        </Router>
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;