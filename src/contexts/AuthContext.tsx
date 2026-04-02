// ... existing code ...
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuth();
  const { session } = useSession();
  // ... rest of the code ...
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile, 
      loading, 
      signOut, 
      refreshProfile,
      signUp,
      signIn,
      resetPassword,
      isLoaded, // Add this line
    }}>
      {children}
    </AuthContext.Provider>
  );
};
// ... existing code ...