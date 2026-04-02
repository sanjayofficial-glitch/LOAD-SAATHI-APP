import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Eager load core pages for instant first paint
import Index from "./pages/Index";
import ChooseRole from "./pages/ChooseRole";
import AuthSync from "./components/AuthSync";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";

// Lazy load secondary pages to reduce initial bundle size
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const MyTrips = lazy(() => import("./pages/trucker/MyTrips"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const BrowseShipments = lazy(() => import("./pages/trucker/BrowseShipments"));
const MyShipmentRequests = lazy(() => import("./pages/trucker/MyShipmentRequests"));
const TruckerHistory = lazy(() => import("./pages/TruckerHistory"));
const PostShipments = lazy(() => import("./pages/shipper/PostShipments"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const EditShipment = lazy(() => import("./pages/shipper/EditShipment"));
const ShipmentDetail = lazy(() => import("./pages/shipper/ShipmentDetail"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Chat = lazy(() => import("./pages/Chat"));
const ShipperHistory = lazy(() => import("./pages/ShipperHistory"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with caching defaults
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
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-10 w-10 text-orange-600 animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={
                <SignedOut>
                  <SignIn routing="path" path="/login" forceRedirectUrl="/auth-sync" />
                </SignedOut>
              } />
              <Route path="/register" element={
                <SignedOut>
                  <SignUp routing="path" path="/register" forceRedirectUrl="/choose-role" />
                </SignedOut>
              } />
              
              <Route path="/choose-role" element={<ChooseRole />} />
              <Route path="/auth-sync" element={<AuthSync />} />
              
              {/* Shipper Protected Routes */}
              <Route path="/shipper/dashboard" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><ShipperDashboard /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/shipper/post-shipment" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><PostShipments /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/shipper/my-shipments" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><MyShipments /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/shipper/edit-shipment/:id" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><EditShipment /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/shipments/:id" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><ShipmentDetail /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/browse-trucks" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><BrowseTrips /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/shipper/history" element={<SignedIn><RoleProtectedRoute allowedRole="shipper"><Layout><ShipperHistory /></Layout></RoleProtectedRoute></SignedIn>} />
              
              {/* Trucker Protected Routes */}
              <Route path="/trucker/dashboard" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><TruckerDashboard /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/post-trip" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><PostTrip /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/my-trips" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><MyTrips /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/edit-trip/:id" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><EditTrip /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/browse-shipments" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><BrowseShipments /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/my-requests" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><MyShipmentRequests /></Layout></RoleProtectedRoute></SignedIn>} />
              <Route path="/trucker/history" element={<SignedIn><RoleProtectedRoute allowedRole="trucker"><Layout><TruckerHistory /></Layout></RoleProtectedRoute></SignedIn>} />
              
              {/* Shared Protected Routes */}
              <Route path="/trips/:id" element={<SignedIn><Layout><TripDetail /></Layout></SignedIn>} />
              <Route path="/profile" element={<SignedIn><Layout><Profile /></Layout></SignedIn>} />
              <Route path="/messages" element={<SignedIn><Layout><ChatList /></Layout></SignedIn>} />
              <Route path="/chat/:requestId" element={<SignedIn><Layout><Chat /></Layout></SignedIn>} />
              <Route path="/admin" element={<SignedIn><Layout><AdminDashboard /></Layout></SignedIn>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;