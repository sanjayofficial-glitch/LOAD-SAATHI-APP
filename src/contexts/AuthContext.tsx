"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: 'trucker' | 'shipper', fullName: string, phone: string, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, user_type, is_verified, rating, total_trips, created_at, company_name')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error);
      }
      
      if (data) {
        return data as User;
      }

      const metadata = supabaseUser.user_metadata;
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        full_name: metadata?.full_name || 'User',
        phone: metadata?.phone || '',
        user_type: metadata?.user_type || 'shipper',
        is_verified: false,
        rating: 0,
        total_trips: 0,
        created_at: supabaseUser.created_at
      } as User;
    } catch (err) {
      console.error("[AuthContext] Unexpected error in fetchUserProfile:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          const profile = await fetchUserProfile(initialSession.user);
          if (mounted) setUserProfile(profile);
        }
      } catch (error) {
        console.error("[AuthContext] Auth initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("[AuthContext] Auth state changed:", event);

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          // Instead of window.location.href which reloads the page and might lose state,
          // we let the component handle it or use a softer redirect if needed.
          // For now, we'll keep the redirect but ensure it's handled by the UpdatePassword component.
          console.log("[AuthContext] Password recovery detected.");
          return;
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          if (!userProfile || userProfile.id !== currentSession.user.id) {
            const profile = await fetchUserProfile(currentSession.user);
            if (mounted) setUserProfile(profile);
          }
        }
        
        if (mounted) setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchUserProfile, loading, userProfile]);

  const signUp = async (email: string, password: string, userType: 'trucker' | 'shipper', fullName: string, phone: string, companyName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, user_type: userType, company_name: companyName || null }
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      return { error };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, signUp, signIn, signOut, refreshProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};