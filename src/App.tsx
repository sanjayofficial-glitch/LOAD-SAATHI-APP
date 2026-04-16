Update the imports to use the correct case-sensitive paths that exist in the project:

```tsx
// Replace these lines:
import TruckerHistory from "./pages/trucker/TruckerHistory";
import ShipperHistory from "./pages/shipper/ShipperHistory";

// With:
import TruckerHistory from "./pages/trucker/TruckerHistory";
import ShipperHistory from "./pages/shipper/ShipperHistory";
```

Both modules exist at these exact paths, so the imports will resolve correctly.