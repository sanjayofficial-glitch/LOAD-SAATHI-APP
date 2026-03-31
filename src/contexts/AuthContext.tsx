"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthContextType {
  user: any;
  isLoaded: boolean;
  isSignedIn: boolean;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);
        return null;
      }

      return data as User;
    } catch (err) {
      console.error("[AuthContext] Unexpected error in fetchUserProfile:", err);
      return null;
    }
  }, []);

  const createUserProfile = useCallback(async (clerkUser: any) => {
    const userType = clerkUser.unsafeMetadata?.user_type || 'shipper';
    const fullName = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    
    try {
      // Check if profile already exists
      const existing = await fetchUserProfile(clerkUser.id);
      if (existing) return existing;

      // Insert new profile with Clerk user ID
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          full_name: fullName,
          user_type: userType,
          is_verified: false,
          rating: 0,
          total_trips: 0
        })
        .select()
        .single();

      if (error) {
        console.error("[AuthContext] Error creating profile:", error);
        // If it's a duplicate key error, try fetching again
        if (error.code === '23505') {
          return await fetchUserProfile(clerkUser.id);
        }
        return null;
      }
      return data as User;
    } catch (err) {
      console.error("[AuthContext] Unexpected error in createUserProfile:", err);
      return null;
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const syncProfile = async () => {
      if (isLoaded) {
        if (isSignedIn && user) {
          let profile = await fetchUserProfile(user.id);
          
          // If profile doesn't exist in Supabase, create it
          if (!profile) {
            console.log("[AuthContext] Profile missing, creating for:", user.id);
            profile = await createUserProfile(user);
          }
          
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    };

    syncProfile();
  }, [isLoaded, isSignedIn, user, fetchUserProfile, createUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  }, [user, fetchUserProfile]);

  const handleSignOut = async () => {
    await clerkSignOut();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoaded, 
      isSignedIn: !!isSignedIn, 
      userProfile, 
      loading: !isLoaded || loading, 
      signOut: handleSignOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;