import { ClerkProvider } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/types";

const ClerkProviderWrapper = ({ children }) => {
  const { userProfile } = useAuth();
  const { user } = useUser();

  return (
    <ClerkProvider
      user={user}
      onAuthStateChange={(auth) => {
        if (auth) {
          const { user } = auth;
          const { full_name, email, user_type } = user;
          const profile = {
            id: user.id,
            full_name: full_name || '',
            email: email || '',
            user_type: user_type || 'shipper',
            company_name: '',
            rating: 0,
            total_trips: 0,
            created_at: new Date().toISOString(),
          };
          return profile;
        }
        return null;
      }}
    >
      {children}
    </ClerkProvider>
  );
};

export { ClerkProviderWrapper };