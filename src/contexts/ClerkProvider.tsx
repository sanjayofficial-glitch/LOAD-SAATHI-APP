"use client";

import { ClerkProvider } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';

const publicKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publicKey) {
  console.error('[ClerkProvider] VITE_CLERK_PUBLISHABLE_KEY is not defined');
}

export default function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={publicKey}
      // Optional: configure Clerk appearance
      theme="light"
    >
      {children}
    </ClerkProvider>
  );
}
＜/dyad-write>

Then update main App.tsx to wrap with ClerkProvider. But App.tsx already uses AuthProvider. We could replace AuthProvider with ClerkProvider, but maybe they want to keep both? Let's just wrap the whole app with ClerkProvider and keep AuthContext maybe not needed. But to be safe, we can create a new root component that provides ClerkProvider and also maybe keep AuthContext for internal usage.

Simplify: In src/main.tsx, import ClerkProvider and wrap root with it.

＜dyad-write path="src/main.tsx" description="Wrap the app with ClerkProvider">
"use client";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import * as Sentry from "@sentry/react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./globals.css";
import ClerkProvider from "./contexts/ClerkProvider";

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider>
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
＜/dyad-write>

Also need to add environment variable to .env (but .env is excluded). Could add .env.example entry.

But maybe not needed.

Let's also add a .env.example entry for VITE_CLERK_PUBLISHABLE_KEY.

＜dyad-write path=".env.example" description="Add Clerk publishable key to env example">
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
＜/dyad-write>

But .env.example currently empty. We'll add that line.

Now respond with chat summary.
</think><dyad-chat-summary>Added Clerk React dependency and basic provider setup</dyad-chat-summary><dyad-write path="src/components/ClerkProvider.tsx">
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