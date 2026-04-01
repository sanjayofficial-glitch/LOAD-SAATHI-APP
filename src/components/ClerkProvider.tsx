"use client";

import React from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@/types";

interface ClerkContextType {
  user: any;
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
  userProfile: User | null;
  loading: boolean;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export const useClerk = () => {
  const context = useContext(ClerkContext);
  if (!context) {
    throw new Error("useClerk must be used within a ClerkAuthProvider");
  }
  return context;
};

export const ClerkAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useAuth();
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
    <ClerkContext.Provider
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
    </ClerkContext.Provider>
  );
};