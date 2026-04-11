// ... existing route definitions ...
<Route path="/trucker/browse-shipments" element={
  <RoleProtectedRoute allowedRole="trucker">
    <BrowseShipments />
  </RoleProtectedRoute>
} />
// ... rest of routes ...