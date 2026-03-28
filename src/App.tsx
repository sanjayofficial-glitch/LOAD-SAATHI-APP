import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Truck } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const TruckerDashboard = lazy(() => import("./pages/trucker/Dashboard"));
const ShipperDashboard = lazy(() => import("./pages/shipper/Dashboard"));
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const MyTrips = lazy(() => import("./pages/trucker/MyTrips"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const TestAuth = lazy(() => import("./pages/TestAuth"));

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
  <div className="min-h-screen flex items-center justify-center bg-orange-50/30">
    <div className="text-center">
      <Truck className="h-10 w-10 text-orange-600 animate-bounce mx-auto mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading LoadSaathi...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedTypes }: { children: React.ReactNode, allowedTypes?: ('trucker' | 'shipper')[] }) => {
  const { userProfile, loading } = useAuth();

  if (loading) return <LoadingFallback />;

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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;