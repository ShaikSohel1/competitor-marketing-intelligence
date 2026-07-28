import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Supabase PKCE email confirmation callback.
 * When a user clicks the verification email link, Supabase redirects them to
 * /auth/callback?code=<code>. This route exchanges the code for a session,
 * then redirects to the correct page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/dashboard';

  if (!code) {
    // No code provided — redirect to login with an error
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[auth/callback] Error exchanging code:', error?.message);
    return NextResponse.redirect(`${origin}/?error=auth_callback_error`);
  }

  // Check if the user already has a company profile
  const userId = data.session.user.id;
  const { data: profile } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  // New user → go to onboarding; returning user → go to dashboard
  const redirectTo = profile ? '/app/dashboard' : '/app/onboarding';

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
