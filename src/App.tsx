import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/skeleton";
import Layout from "./components/Layout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthSync = lazy(() => import("./components/AuthSync"));
const ChooseRole = lazy(() => import("./pages/ChooseRole"));
const TruckerDashboard = lazy(() => import("./pages/trucker/Dashboard"));
const PostTrip = lazy(() => import("./pages/trucker/PostTrip"));
const TruckerHub = lazy(() => import("./pages/trucker/TruckerHub"));
const EditTrip = lazy(() => import("./pages/trucker/EditTrip"));
const TruckerTripDetail = lazy(() => import("./pages/trucker/TruckerTripDetail"));
const BrowseShipments = lazy(() => import("./pages/trucker/BrowseShipments"));
const BrowseTrips = lazy(() => import("./pages/shipper/BrowseTrips"));
const TruckerHistory = lazy(() => import("./pages/trucker/TruckerHistory"));
const ShipperDashboard = lazy(() => import("./pages/shipper/Dashboard"));
const PostShipments = lazy(() => import("./pages/shipper/PostShipments"));
const MyShipments = lazy(() => import("./pages/shipper/MyShipments"));
const ShipmentDetail = lazy(() => import("./pages/shipper/ShipmentDetail"));
const EditShipment = lazy(() => import("./pages/shipper/EditShipment"));
const ShipperHistory = lazy(() => import("./pages/shipper/ShipperHistory"));
const TripDetail = lazy(() => import("./pages/TripDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminMonitoringDashboard = lazy(() => import("./pages/admin/MonitoringDashboard"));

const queryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-screen w-full" />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth-sync" element={<AuthSync />} />
                  <Route path="/choose-role" element={<ChooseRole />} />

                  {/* Admin routes - Only accessible by admin users */}
                  <Route element={
                    <RoleProtectedRoute allowedRole="admin">
                      <Outlet />
                    </RoleProtectedRoute>
                  }>
                    <Route path="/admin/monitoring" element={<AdminMonitoringDashboard />} />
                  </Route>

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
                    <Route path="/trucker/history" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <TruckerHistory />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/trucker/browse-shipments" element={
                      <RoleProtectedRoute allowedRole="trucker">
                        <BrowseShipments />
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
                    <Route path="/browse-trucks" element={
                      <RoleProtectedRoute allowedRole="both">
                        <BrowseTrips />
                      </RoleProtectedRoute>
                    } />

                    {/* Common authenticated routes */}
                    <Route path="/trips/:tripId" element={<TripDetail />} />
                    <Route path="/chat/:requestId" element={<Chat />} />
                    <Route path="/messages" element={<ChatList />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster position="top-center" richColors />
    </ClerkProvider>
  );
}

export default App;