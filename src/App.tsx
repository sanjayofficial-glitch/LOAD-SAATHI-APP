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

// Eager load core pages for faster transitions
import Index from "./pages/Index";
import Login from "./pages/Login";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";

// Lazy load secondary pages
const NotFound = lazy(() => import("./pages/NotFound"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const MyTrips = lazy(() => import("./pages/trucker/MyTrips"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatList = lazy(() => import("./pages/ChatList"));
const TestAuth = lazy(() => import("./pages/TestAuth"));
const PostShipments = lazy(() => import("./pages/shipper/PostShipments"));
const EditShipment = lazy(() => import("./pages/shipper/EditShipment"));
const BrowseShipments = lazy(() => import("./pages/trucker/BrowseShipments"));
const ShipmentDetail = lazy(() => import("./pages/shipper/ShipmentDetail"));
const MyShipmentRequests = lazy(() => import("./pages/trucker/MyShipmentRequests"));

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