"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types';

interface AuthContextType {
  user: any | null;
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
  const { isLoaded, isSignedIn, user, signOut: clerkSignOut } = useClerkAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (clerkUserId: string) => {
    try {
      // Try to fetch existing profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', clerkUserId)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);
        return null;
      }

      // If profile exists, return it
      if (data) {
        return data as User;
      }

      // If no profile exists, create one using metadata
      const metadata = user?.publicMetadata || {};
      const newProfile = {
        id: clerkUserId,
        email: user?.emailAddresses[0]?.emailAddress || '',
        full_name: metadata?.full_name || user?.fullName || 'User',
        phone: metadata?.phone || '',
        user_type: metadata?.user_type || 'shipper',
        is_verified: false,
        rating: 0,
        total_trips: 0,
        created_at: new Date().toISOString(),
        company_name: metadata?.company_name || null
      };

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error("[AuthContext] Error creating profile:", insertError);
        return null;
      }

      return inserted as User;
    } catch (err) {
      console.error("[AuthContext] Unexpected error in fetchUserProfile:", err);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn && user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [isLoaded, isSignedIn, user, fetchUserProfile]);

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
      isSignedIn, 
      userProfile, 
      loading, 
      signOut: handleSignOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};