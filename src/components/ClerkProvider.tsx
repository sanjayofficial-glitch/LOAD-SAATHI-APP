"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export const ClerkProviderWrapper = ({ children }: ClerkProviderWrapperProps) => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as "trucker" | "shipper";
      // Redirect based on role
      if (role === "trucker") {
        window.location.href = "/trucker-dashboard";
      } else {
        window.location.href = "/shipper-dashboard";
      }
    }
  }, [isLoaded, user]);

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey} 
      afterSignInUrl="/" 
      afterSignUpUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;