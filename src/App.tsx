import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout"; // <-- now correctly exports default
import TruckerDashboard from "./pages/trucker/Dashboard";
import ShipperDashboard from "./pages/shipper/Dashboard";
// ... other imports remain unchanged ...

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth-sync" element={<AuthSync />} />
              <Route path="/choose-role" element={<ChooseRole />} />

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
                <Route path="/trucker/browse-shipments" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <BrowseShipments />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/my-requests" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHub />
                  </RoleProtectedRoute>
                } />
                <Route path="/trucker/history" element={
                  <RoleProtectedRoute allowedRole="trucker">
                    <TruckerHistory />
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
                <Route path="/browse-trucks" element={<BrowseTrips />} />
                <Route path="/browse-shipments" element={<BrowseShipments />} />

                {/* Common authenticated routes */}
                <Route path="/trips/:tripId" element={<TripDetail />} />
                <Route path="/chat/:requestId" element={<Chat />} />
                <Route path="/messages" element={<ChatList />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/browse-shipments" element={<BrowseShipments />} />
                <Route path="/browse-trips" element={<BrowseTrips />} />

                {/* Catch‑all */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </function>

    export default App;