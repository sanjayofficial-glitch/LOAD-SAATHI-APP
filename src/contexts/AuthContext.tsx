"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useSession, useClerk } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types';

interface AuthContextType {
  user: any;
  session: any;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, role: 'shipper' | 'trucker') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const { signOut: clerkSignOut, getToken } = useClerk();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const supabaseToken = await getToken({ template: 'supabase' });
      if (!supabaseToken) return;
      
      const supabaseClient = createClerkSupabaseClient(supabaseToken);
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data as User);
      }
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile:', err);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!clerkLoaded || !user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        const supabaseClient = createClerkSupabaseClient(supabaseToken);
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[AuthContext] Error fetching user profile:', error);
          setUserProfile(null);
        } else if (data) {
          setUserProfile(data as User);
        }
      } catch (err) {
        console.error('[AuthContext] Error:', err);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [clerkLoaded, user, getToken]);

  const signOut = async () => {
    await clerkSignOut();
    setUserProfile(null);
  };

  const signUp = async (email: string, password: string, role: 'shipper' | 'trucker') => {
    // Clerk handles sign-up via UI components, this is for API-based sign-up if needed
    throw new Error('Use Clerk SignUp component for registration');
  };

  const signIn = async (email: string, password: string) => {
    // Clerk handles sign-in via UI components, this is for API-based sign-in if needed
    throw new Error('Use Clerk SignIn component for authentication');
  };

  const resetPassword = async (email: string) => {
    // Use Clerk's built-in password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signOut,
    refreshProfile,
    signUp,
    signIn,
    resetPassword,
    isLoaded: clerkLoaded,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};