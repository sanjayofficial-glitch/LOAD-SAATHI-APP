"use client";

import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@/types";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";

interface ClerkContextType {
  user: ReturnType<typeof useUser>["user"];
  isSignedIn: ReturnType<typeof useUser>["isSignedIn"];
  isLoaded: ReturnType<typeof useUser>["isLoaded"];
  signOut: () => Promise<void>;
  userProfile: User | null;
  loading: boolean;
}

const ClerkContext = /*#__PURE__*/ (() => {
  const ctx = /*#__PURE__*/ React.createContext<ClerkContextType | undefined>(undefined);
  
  return {
    ClerkContext: ctx,
    useClerk: () => {
      const context = React.useContext(ctx);
      if (!context) {
        throw new Error("useClerk must be used within a ClerkAuthProvider");
      }
      return context;
    }
  };
})();

export const ClerkAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isSignedIn, isLoaded, signOut: clerkSignOut } = useUser();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToDatabase = useCallback(async (clerkUser: any) => {
    if (!clerkUser) return null;

    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", clerkUser.id)
        .single();

      if (existingUser) {
        return existingUser as User;
      }

      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          full_name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || "",
          user_type: "shipper",
          is_verified: clerkUser.verifications?.status === "verified",
          rating: 0,
          total_trips: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user in database:", error);
        return null;
      }

      return newUser as User;
    } catch (error) {
      console.error("Error syncing user:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initUser = async () => {
      if (!isLoaded) return;

      if (isSignedIn && user) {
        const profile = await syncUserToDatabase(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    initUser();
  }, [isLoaded, isSignedIn, user, syncUserToDatabase]);

  const signOut = async () => {
    await clerkSignOut();
    setUserProfile(null);
  };

  return (
    <ClerkContext.ClerkContext.Provider
      value={{
        user,
        isSignedIn,
        isLoaded,
        signOut,
        userProfile,
        loading,
      }}
    >
      {children}
    </ClerkContext.ClerkContext.Provider>
  );
};