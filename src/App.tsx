import EditShipment from "./pages/shipper/EditShipment";
import ShipmentDetail from "./pages/ShipmentDetail";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {
  return (
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
      <Route path="/browse-trucks" element={<BrowseTrips />} />
      <Route path="/trucker/browse-shipments" element={<BrowseShipments />} />
      <Route path="/trucker/post-trip" element={<PostTrip />} />
      <Route path="/shipper/post-shipment" element={<PostShipments />} />

      {/* Direct routes to avoid children prop issues with RoleProtectedRoute */}
      <Route path="/shipper/dashboard" element={<ShipperDashboard />} />
      <Route path="/shipper/my-shipments" element={<ShipperHistory />} />
      <Route path="/trucker/dashboard" element={<TruckerDashboard />} />
      <Route path="/trucker/my-trips" element={<TruckerHub />} />
      <Route path="/trucker/trips/:tripId" element={<TruckerTripDetail />} />
      <Route path="/admin/monitoring" element={<AdminMonitoring />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;