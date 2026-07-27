import { supabase } from './supabase';

/**
 * Gets the current authenticated user's ID.
 */
export async function getUserId(): Promise<string> {
  try {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      // Check if session exists in storage
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      if (sessionUser?.id) {
        return sessionUser.id;
      }
      return '';
    }

    return user.id;
  } catch (err) {
    console.warn('[User Service] getUserId exception caught:', err);
    return '';
  }
}

export async function getUserCompetitorIds(): Promise<string[]> {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('id')
      .eq('user_id', userId);

    if (error) {
      console.warn('User competitors lookup warning:', error.message);
      return [];
    }

    return (data ?? []).map((item: { id: string }) => item.id);
  } catch (err) {
    console.warn('[User Service] getUserCompetitorIds exception caught:', err);
    return [];
  }
}
