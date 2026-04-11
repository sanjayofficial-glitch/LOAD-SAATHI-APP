const App = () => {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Auth & Role Setup */}
            <Route path="/auth-sync" element={<AuthSync />} />
            <Route path="/choose-role" element={<ChooseRole />} />

            {/* Protected Routes with Layout */}
            <Route element={<SignedIn><Layout><RoleProtectedRoute><Outlet /></RoleProtectedRoute></Layout></SignedIn>}>
              {/* Trucker Routes */}
              <Route path="/trucker/dashboard" element={<RoleProtectedRoute allowedRole="trucker"><TruckerDashboard /></RoleProtectedRoute>} />
              <Route path="/trucker/post-trip" element={<RoleProtectedRoute allowedRole="trucker"><PostTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/my-trips" element={<RoleProtectedRoute allowedRole="trucker"><MyTrips /></RoleProtectedRoute>} />
              <Route path="/trucker/trips/:tripId/edit" element={<RoleProtectedRoute allowedRole="trucker"><EditTrip /></RoleProtectedRoute>} />
              <Route path="/trucker/browse-shipments" element={<RoleProtectedRoute allowedRole="trucker"><BrowseShipments /></RoleProtectedRoute>} />
              <Route path="/trucker/my-requests" element={<RoleProtectedRoute allowedRole="trucker"><MyRequests /></RoleProtectedRoute>} />
              <Route path="/trucker/history" element={<RoleProtectedRoute allowedRole="trucker"><TruckerHistory /></RoleProtectedRoute>} />

              {/* Shipper Routes */}
              <Route path="/shipper/dashboard" element={<RoleProtectedRoute allowedRole="shipper"><ShipperDashboard /></RoleProtectedRoute>} />
              <Route path="/shipper/post-shipment" element={<RoleProtectedRoute allowedRole="shipper"><PostShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/my-shipments" element={<RoleProtectedRoute allowedRole="shipper"><MyShipments /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:id" element={<RoleProtectedRoute allowedRole="shipper"><ShipmentDetail /></RoleProtectedRoute>} />
              <Route path="/shipper/shipments/:shipmentId/edit" element={<RoleProtectedRoute allowedRole="shipper"><EditShipment /></RoleProtectedRoute>} />
              <Route path="/shipper/history" element={<RoleProtectedRoute allowedRole="shipper"><ShipperHistory /></RoleProtectedRoute>} />

              {/* Common Protected Routes */}
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