import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const ClerkProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ""}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
};

export { ClerkProviderWrapper };