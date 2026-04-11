import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ClerkProvider, SignedIn } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import AuthSync from "./components/AuthSync";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import MyTrips from "./pages/trucker/MyTrips";
import EditTrip from "./pages/trucker/EditTrip";
import MyRequests from "./pages/trucker/MyRequests";
import TruckerHistory from "./pages/TruckerHistory";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import EditShipment from "./pages/shipper/EditShipment";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import ShipperHistory from "./pages/ShipperHistory";
import TripDetail from "./pages/TripDetail";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import "./globals.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth-sync" element={<AuthSync />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            <Route element={<SignedIn><Layout><RoleProtectedRoute><Outlet /></RoleProtectedRoute></Layout></SignedIn>}>
              <Route path="/trucker/dashboard" element={<RoleProtectedRoute allowedRole="trucker"><TruckerDashboard /></RoleProtectedRoute>} />
              <Route path="/trucker/post-trip" element={<RoleProtectedRoute allowedRole="trucker"><PostTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/my-trips" element={<RoleProtectedRoute allowedRole="trucker"><MyTrips /></RoleProtectedRoute>} />
              <Route path="/trucker/trips/:tripId/edit" element={<RoleProtectedRoute allowedRole="trucker"><EditTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/browse-shipments" element={<RoleProtectedRoute allowedRole="trucker"><BrowseShipments /></RoleProtectedRoute>} />
              <Route path="/trucker/my-requests" element={<RoleProtectedRoute allowedRole="trucker"><MyRequests /></RoleProtectedRoute>} />
              <Route path="/trucker/history" element={<RoleProtectedRoute allowedRole="trucker"><TruckerHistory /></RoleProtectedRoute>} />
              <Route path="/shipper/dashboard" element={<RoleProtectedRoute allowedRole="shipper"><ShipperDashboard /></RoleProtectedRoute>} />
              <Route path="/shipper/post-shipment" element={<RoleProtectedRoute allowedRole="shipper"><PostShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/my-shipments" element={<RoleProtectedRoute allowedRole="shipper"><MyShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:id" element={<RoleProtectedRoute allowedRole="shipper"><ShipmentDetail /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:shipmentId/edit" element={<RoleProtectedRoute allowedRole="shipper"><EditShipment /></RoleProtectedRoute>} />
              <Route path="/shipper/history" element={<RoleProtectedRoute allowedRole="shipper"><ShipperHistory /></RoleProtectedRoute>} />
              <Route path="/trips/:tripId" element={<TripDetail />} />
              <Route path="/chat/:requestId" element={<Chat />} />
              <Route path="/messages" element={<ChatList />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ClerkProvider>
  );
};

export default App;