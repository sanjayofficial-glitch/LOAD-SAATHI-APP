"use client";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Sentry } from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Initialize Sentry with a placeholder DSN (replace with actual DSN)
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);