import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Truck, Loader2 } from "lucide-react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Eager load core pages
import Index from "./pages/Index";
import ChooseRole from "./pages/ChooseRole";
import AuthSync from "./components/AuthSync";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";

// Lazy load secondary pages
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const MyTrips = lazy(() => import("./pages/trucker/MyTrips"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const BrowseShipments = lazy(() => import("./pages/trucker/BrowseShipments"));
const MyShipmentRequests = lazy(() => import("./pages/trucker/MyShipmentRequests"));
const PostShipments = lazy(() => import("./pages/shipper/PostShipments"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const EditShipment = lazy(() => import("./pages/shipper/EditShipment"));
const ShipmentDetail = lazy(() => import("./pages/shipper/ShipmentDetail"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-10 w-10 text-orange-600 animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SpeedInsights />
          <BrowserRouter>
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
                  
                  {/* Protected Routes */}
                  <Route path="/shipper/dashboard" element={<SignedIn><Layout><ShipperDashboard /></Layout></SignedIn>} />
                  <Route path="/shipper/post-shipment" element={<SignedIn><Layout><PostShipments /></Layout></SignedIn>} />
                  <Route path="/shipper/my-shipments" element={<SignedIn><Layout><MyShipments /></Layout></SignedIn>} />
                  <Route path="/shipper/edit-shipment/:id" element={<SignedIn><Layout><EditShipment /></Layout></SignedIn>} />
                  <Route path="/shipments/:id" element={<SignedIn><Layout><ShipmentDetail /></Layout></SignedIn>} />
                  
                  <Route path="/trucker/dashboard" element={<SignedIn><Layout><TruckerDashboard /></Layout></SignedIn>} />
                  <Route path="/trucker/post-trip" element={<SignedIn><Layout><PostTrip /></Layout></SignedIn>} />
                  <Route path="/trucker/my-trips" element={<SignedIn><Layout><MyTrips /></Layout></SignedIn>} />
                  <Route path="/trucker/edit-trip/:id" element={<SignedIn><Layout><EditTrip /></Layout></SignedIn>} />
                  <Route path="/trucker/browse-shipments" element={<SignedIn><Layout><BrowseShipments /></Layout></SignedIn>} />
                  <Route path="/trucker/my-requests" element={<SignedIn><Layout><MyShipmentRequests /></Layout></SignedIn>} />
                  
                  <Route path="/browse-trucks" element={<SignedIn><Layout><BrowseTrips /></Layout></SignedIn>} />
                  <Route path="/trips/:id" element={<SignedIn><Layout><TripDetail /></Layout></SignedIn>} />
                  <Route path="/profile" element={<SignedIn><Layout><Profile /></Layout></SignedIn>} />
                  <Route path="/messages" element={<SignedIn><Layout><ChatList /></Layout></SignedIn>} />
                  <Route path="/chat/:requestId" element={<SignedIn><Layout><Chat /></Layout></SignedIn>} />
                  <Route path="/admin" element={<SignedIn><Layout><AdminDashboard /></Layout></SignedIn>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;