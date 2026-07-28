"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasCompanyProfile: boolean;
  checkingProfile: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if the user has filled in their company profile
  const checkCompanyProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setHasCompanyProfile(false);
      setCheckingProfile(false);
      return;
    }
    setCheckingProfile(true);
    try {
      const { data } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      setHasCompanyProfile(!!data);
    } catch {
      // If the table doesn't exist yet or query fails, treat as no profile
      setHasCompanyProfile(false);
    } finally {
      setCheckingProfile(false);
    }
  }, []);

  // Public method so onboarding page can refresh the flag after saving
  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    await checkCompanyProfile(userId);
  }, [session, checkCompanyProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      checkCompanyProfile(data.session?.user?.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      checkCompanyProfile(newSession?.user?.id);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [checkCompanyProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      hasCompanyProfile,
      checkingProfile,
      refreshProfile,
      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email: string, password: string) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app/dashboard`,
        });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, hasCompanyProfile, checkingProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
