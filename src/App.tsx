import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import AuthSync from "./components/AuthSync";
import Layout from "./components/Layout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ChooseRole from "./pages/ChooseRole";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import TripDetail from "./pages/TripDetail";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";
import EditShipment from "./pages/shipper/EditShipment";
import TruckerHub from "./pages/trucker/TruckerHub";
import TruckerTripDetail from "./pages/trucker/TruckerTripDetail";
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";
import ShipperHistory from "./pages/shipper/ShipperHistory";
import TruckerHistory from "./pages/trucker/TruckerHistory";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import PostTrip from "./pages/trucker/PostTrip";
import PostShipments from "./pages/shipper/PostShipments";
import EditTrip from "./pages/trucker/EditTrip";
import AdminMonitoring from "./pages/admin/MonitoringDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/choose-role" element={<ChooseRole />} />
        <Route path="/auth-sync" element={<AuthSync />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat/:requestId" element={<Chat />} />
        <Route path="/messages" element={<ChatList />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/shipments/:id" element={<ShipmentDetail />} />
        <Route path="/shipments/:shipmentId/edit" element={<EditShipment />} />

        {/* Shipper routes */}
        <Route element={<RoleProtectedRoute allowedRole="shipper" />}>
          <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
          <Route path="/shipper/my-shipments" element={<ShipperHistory />} />
          <Route path="/shipper/shipments/:id" element={<ShipmentDetail />} />
          <Route path="/shipper/shipments/:shipmentId/edit" element={<EditShipment />} />
          <Route path="/shipper/history" element={<ShipperHistory />} />
          <Route path="/browse-trucks" element={<BrowseTrips />} />
          <Route path="/shipper/post-shipment" element={<PostShipments />} />
        </Route>

        {/* Trucker routes */}
        <Route element={<RoleProtectedRoute allowedRole="trucker" />}>
          <Route path="/trucker/dashboard" element={<TruckerDashboard />} />
          <Route path="/trucker/my-trips" element={<TruckerHub />} />
          <Route path="/trucker/trips/:tripId" element={<TruckerTripDetail />} />
          <Route path="/trucker/trips/:tripId/edit" element={<EditTrip />} />
          <Route path="/trucker/browse-shipments" element={<BrowseShipments />} />
          <Route path="/trucker/post-trip" element={<PostTrip />} />
          <Route path="/trucker/history" element={<TruckerHistory />} />
        </Route>

        {/* Admin route */}
        <Route element={<RoleProtectedRoute allowedRole="admin" />}>
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;