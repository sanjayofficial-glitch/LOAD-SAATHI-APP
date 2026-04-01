"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
};