"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True while Supabase is initialising the session on first load */
  loading: boolean;
  /** True only while querying the company_profiles table */
  checkingProfile: boolean;
  hasCompanyProfile: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function queryHasProfile(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Start as false — don't block UI before we even know if there's a session
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);

  const updateProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setHasCompanyProfile(false);
      setCheckingProfile(false);
      return;
    }
    setCheckingProfile(true);
    const result = await queryHasProfile(userId);
    setHasCompanyProfile(result);
    setCheckingProfile(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    await updateProfile(userId);
  }, [session, updateProfile]);

  useEffect(() => {
    // Initialise: get current session once
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // Only check profile if we actually have a session
      if (data.session?.user?.id) {
        updateProfile(data.session.user.id);
      }
    });

    // Listen for all auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession?.user?.id) {
        updateProfile(newSession.user.id);
      } else {
        // Signed out — clear immediately
        setHasCompanyProfile(false);
        setCheckingProfile(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [updateProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      checkingProfile,
      hasCompanyProfile,
      refreshProfile,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          },
        });
        if (error) throw error;
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, checkingProfile, hasCompanyProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
