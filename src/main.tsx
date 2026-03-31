"use client";

import "./globals.css";
import App from "./App";
import { ClerkProviderWrapper } from "./components/ClerkProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProviderWrapper>
      <App />
    </ClerkProviderWrapper>
  </StrictMode>,
);