"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, hasCompanyProfile, checkingProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/');
    }
  }, [loading, session, router]);

  // Once authenticated & profile check is done, enforce onboarding
  useEffect(() => {
    if (loading || checkingProfile || !session) return;
    if (!hasCompanyProfile && pathname !== '/app/onboarding') {
      router.replace('/app/onboarding');
    }
  }, [loading, checkingProfile, session, hasCompanyProfile, pathname, router]);

  if (loading || checkingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
