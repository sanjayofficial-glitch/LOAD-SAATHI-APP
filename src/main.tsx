import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";
import App from "./App";
import ClerkProviderWrapper from "./components/ClerkProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProviderWrapper>
  </StrictMode>,
);