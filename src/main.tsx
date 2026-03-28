"use client";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

// Initialize Sentry with a placeholder DSN (replace with actual value)
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

import { ErrorBoundary } from "./components/ErrorBoundary";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);