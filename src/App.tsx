import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import TripDetail from "./pages/TripDetail";
import MyTrips from "./pages/trucker/MyTrips";
import MyShipments from "./pages/shipper/MyShipments";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import Chat from "./pages/Chat";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedTypes }: { children: React.ReactNode, allowedTypes?: ('trucker' | 'shipper')[] }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/login" />;
  }

  if (allowedTypes && !allowedTypes.includes(userProfile.user_type)) {
    return <Navigate to={userProfile.user_type === 'trucker' ? '/trucker/dashboard' : '/shipper/dashboard'} />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
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
            <Route path="/trucker/my-trips" element={
              <ProtectedRoute allowedTypes={['trucker']}>
                <MyTrips />
              </ProtectedRoute>
            } />
            
            {/* Shipper Routes */}
            <Route path="/shipper/dashboard" element={
              <ProtectedRoute allowedTypes={['shipper']}>
                <ShipperDashboard />
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;