import { ClerkProvider } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";

const ClerkProviderWrapper = ({ children }) => {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;