"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Radar, TrendingUp, Eye, Target, Loader2, AlertCircle, Mail, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup';
type UIState = 'form' | 'email_sent';

function getErrorMessage(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes('invalid login') || l.includes('invalid credentials')) {
    return 'Incorrect email or password. If you are new, switch to Sign Up.';
  }
  if (l.includes('already registered') || l.includes('already been registered') || l.includes('user already registered')) {
    return 'An account with this email already exists. Switch to Sign In.';
  }
  if (l.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Check your inbox for the verification link.';
  }
  if (l.includes('too many requests') || l.includes('rate limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (l.includes('network') || l.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return msg;
}

export default function AuthPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('signin');
  const [uiState, setUiState] = useState<UIState>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState('');

  // Already logged in → redirect away from the login page
  useEffect(() => {
    if (!loading && session) {
      router.replace('/app/dashboard');
    }
  }, [loading, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        // AuthContext will update session → ProtectedRoute/useEffect will redirect
      } else {
        await signUp(email.trim(), password);
        // Email confirmation required — show the "Check your email" screen
        setSignedUpEmail(email.trim());
        setUiState('email_sent');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(getErrorMessage(msg));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }

  // Show loading while checking session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Brand Panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">CompeteIQ</p>
            <p className="text-xs text-primary-foreground/70">Competitor Intelligence</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Know what your competitors are doing — before they do.
          </h1>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Track competitor websites, SEO, social media, pricing, and advertising in one place.
            AI turns raw signals into actionable intelligence, alerts, and weekly reports.
          </p>
          <div className="grid max-w-md grid-cols-2 gap-4 pt-4">
            {[
              { icon: Eye, label: 'Website monitoring' },
              { icon: TrendingUp, label: 'SEO & keyword tracking' },
              { icon: Target, label: 'Pricing intelligence' },
              { icon: Radar, label: 'AI-powered insights' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-accent" />
                <span className="text-primary-foreground/90">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          AI-powered competitive intelligence for modern businesses.
        </p>
      </div>

      {/* ── Form Panel ── */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Radar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">CompeteIQ</p>
              <p className="text-xs text-muted-foreground">Competitor Intelligence</p>
            </div>
          </div>

          {uiState === 'email_sent' ? (
            /* ── Email Confirmation Screen ── */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a verification link to
                </p>
                <p className="mt-1 font-semibold text-foreground">{signedUpEmail}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground text-left space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>Click the link in the email to confirm your account.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>After confirming, you'll be taken to set up your company profile.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>Check your spam folder if you don't see it within a minute.</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setUiState('form');
                  setMode('signin');
                  setEmail(signedUpEmail);
                  setPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            /* ── Auth Form ── */
            <>
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === 'signin'
                  ? 'Sign in to access your competitor dashboard.'
                  : 'Start monitoring your competitors in minutes.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-confirm-password">Confirm Password</Label>
                    <Input
                      id="auth-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
              </form>

              {mode === 'signin' && (
                <div className="mt-4 text-right text-sm text-muted-foreground">
                  <Link href="/forgot-password" className="font-medium text-accent hover:underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className={cn('font-medium text-accent hover:underline underline-offset-4')}
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  disabled={submitting}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
