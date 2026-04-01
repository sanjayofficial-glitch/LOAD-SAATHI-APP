"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useSession, useSignIn, useSignUp } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { User } from '@/types';

interface AuthContextType {
  user: any;
  session: any;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, userType: string, fullName: string, phone: string, company?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
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
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken, setActive } = useClerkAuth();
  const { session } = useSession();
  const { signIn: clerkSignIn } = useSignIn();
  const { signUp: clerkSignUp } = useSignUp();
  
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (clerkUser: any) => {
    if (!clerkUser) return null;
    
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) {
        console.error("[AuthContext] No Supabase token available");
        return null;
      }

      const clerkSupabase = createClerkSupabaseClient(supabaseToken);
      
      const { data, error } = await clerkSupabase
        .from('users')
        .select('id, email, full_name, phone, user_type, is_verified, rating, total_trips, created_at, company_name')
        .eq('id', clerkUser.id)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);
      }
      
      if (data) {
        return data as User;
      }

      return {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        full_name: clerkUser.fullName || 'User',
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
        user_type: 'shipper',
        is_verified: false,
        rating: 0,
        total_trips: 0,
        created_at: clerkUser.createdAt || new Date().toISOString()
      } as User;
    } catch (err) {
      console.error("[AuthContext] Unexpected error in fetchUserProfile:", err);
      return null;
    }
  }, [getToken]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    if (!isLoaded) return;

    const initAuth = async () => {
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [isLoaded, user, fetchUserProfile]);

  const signOut = async () => {
    await clerkSignOut();
    setUserProfile(null);
  };

  const signUp = async (email: string, password: string, userType: string, fullName: string, phone: string, company?: string) => {
    try {
      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { user_type: userType, full_name: fullName, phone, company_name: company }
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.errors?.[0] || err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.errors?.[0] || err };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await clerkSignIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      return { error: null };
    } catch (err: any) {
      return { error: err.errors?.[0] || err };
    }
  };

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
    }}>
      {children}
    </AuthContext.Provider>
  );
};