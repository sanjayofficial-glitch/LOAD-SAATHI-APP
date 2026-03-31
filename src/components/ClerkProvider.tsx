"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export const ClerkProviderWrapper = ({ children }: ClerkProviderWrapperProps) => {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;