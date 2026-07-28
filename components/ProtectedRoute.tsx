"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const ONBOARDING_PATH = '/app/onboarding';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, hasCompanyProfile, checkingProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Still loading auth session — wait
    if (loading) return;

    // 2. Not logged in — send to login
    if (!session) {
      router.replace('/');
      return;
    }

    // 3. Logged in but still checking DB for profile — wait
    if (checkingProfile) return;

    // 4. Logged in, no profile, not on onboarding → force onboarding
    if (!hasCompanyProfile && pathname !== ONBOARDING_PATH) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    // 5. Logged in, HAS profile, sitting on onboarding → push them forward
    if (hasCompanyProfile && pathname === ONBOARDING_PATH) {
      router.replace('/app/dashboard');
      return;
    }
  }, [loading, session, checkingProfile, hasCompanyProfile, pathname, router]);

  // Show spinner while any loading is in progress
  if (loading || (session && checkingProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't flash content while redirect is pending
  if (!session) return null;
  if (!hasCompanyProfile && pathname !== ONBOARDING_PATH) return null;

  return <>{children}</>;
}
