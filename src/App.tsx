import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import MissingClerkKey from "@/components/MissingClerkKey";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import ChatList from "./pages/ChatList";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Shipper pages
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import EditShipment from "./pages/shipper/EditShipment";

// Trucker pages
import TruckerDashboard from "./pages/trucker/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import MyTrips from "./pages/trucker/MyTrips";
import TruckerHistory from "./pages/trucker/TruckerHistory";
import TripDetail from "./pages/TripDetail";
import EditTrip from "./pages/trucker/EditTrip";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import MyShipmentRequests from "./pages/trucker/MyShipmentRequests";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";

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
  
  if (!hasValidClerkKey) {
    return <MissingClerkKey />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* Auth sync route */}
                  <Route path="/auth-sync" element={<AuthSync />} />
                  
                  {/* Choose role - only for new users without role */}
                  <Route 
                    path="/choose-role" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ChooseRole />
                      </RoleProtectedRoute>
                    } 
                  />
                  
                  {/* Shipper routes */}
                  <Route 
                    path="/shipper/dashboard" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ShipperDashboard />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shipper/post-shipment" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <PostShipments />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shipper/my-shipments" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <MyShipments />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shipper/history" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ShipperHistory />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shipper/edit-shipment/:id" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <EditShipment />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/shipments/:id" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <ShipmentDetail />
                      </RoleProtectedRoute>
                    } 
                  />
                  
                  {/* Trucker routes */}
                  <Route 
                    path="/trucker/dashboard" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerDashboard />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/post-trip" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <PostTrip />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/my-trips" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <MyTrips />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/history" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerHistory />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/edit-trip/:id" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <EditTrip />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trips/:id" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TripDetail />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/browse-shipments" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <BrowseShipments />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/trucker/my-requests" 
                    element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <MyShipmentRequests />
                      </RoleProtectedRoute>
                    } 
                  />
                  
                  {/* Shared routes */}
                  <Route 
                    path="/browse-trucks" 
                    element={
                      <RoleProtectedRoute allowedRole="shipper">
                        <BrowseTrips />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <Layout>
                        <ChatList />
                      </Layout>
                    } 
                  />
                  <Route 
                    path="/chat/:requestId" 
                    element={
                      <Layout>
                        <Chat />
                      </Layout>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <Layout>
                        <Profile />
                      </Layout>
                    } 
                  />
                  
                  {/* Admin routes */}
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <RoleProtectedRoute allowedRole="admin">
                        <AdminDashboard />
                      </RoleProtectedRoute>
                    } 
                  />
                  
                  {/* Catch all - 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </Suspense>
          </AuthProvider>
        </ClerkProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;