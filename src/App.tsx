import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import TripDetail from "./pages/TripDetail";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Layout from "./components/Layout";

// Trucker Pages
import TruckerDashboard from "./pages/trucker/Dashboard";
import PostTrip from "./pages/trucker/PostTrip";
import MyTrips from "./pages/trucker/MyTrips";
import EditTrip from "./pages/trucker/EditTrip";
import BrowseShipments from "./pages/trucker/BrowseShipments";
import MyShipmentRequests from "./pages/trucker/MyShipmentRequests";

// Shipper Pages
import ShipperDashboard from "./pages/shipper/Dashboard";
import PostShipments from "./pages/shipper/PostShipments";
import MyShipments from "./pages/shipper/MyShipments";
import EditShipment from "./pages/shipper/EditShipment";
import BrowseTrips from "./pages/shipper/BrowseTrips";
import ShipmentDetail from "./pages/shipper/ShipmentDetail";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Redirect root to /home for first-time visitors */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Index />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        
        {/* Protected Routes with Layout */}
        <Route element={<Layout><div /></Layout>}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<ChatList />} />
          <Route path="/chat/:requestId" element={<Chat />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          
          {/* Trucker Routes */}
          <Route path="/trucker/dashboard" element={<TruckerDashboard />} />
          <Route path="/trucker/post-trip" element={<PostTrip />} />
          <Route path="/trucker/my-trips" element={<MyTrips />} />
          <Route path="/trucker/edit-trip/:id" element={<EditTrip />} />
          <Route path="/trucker/browse-shipments" element={<BrowseShipments />} />
          <Route path="/trucker/my-requests" element={<MyShipmentRequests />} />
          
          {/* Shipper Routes */}
          <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
          <Route path="/shipper/post-shipment" element={<PostShipments />} />
          <Route path="/shipper/my-shipments" element={<MyShipments />} />
          <Route path="/shipper/edit-shipment/:id" element={<EditShipment />} />
          <Route path="/browse-trucks" element={<BrowseTrips />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;