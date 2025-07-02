import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { User, Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
	env.PUBLIC_SUPABASE_URL!,
	env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Auth stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const loading = writable(true);

// Initialize auth state
export async function initAuth() {
  loading.set(true);
  
  // Get initial session
  const { data: { session: initialSession } } = await supabase.auth.getSession();
  session.set(initialSession);
  user.set(initialSession?.user ?? null);
  
  // If we have an initial session, ensure user profile
  if (initialSession?.user) {
    await ensureUserProfile(initialSession.user);
  }
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, currentSession) => {
    console.log('[Auth] State change:', event, currentSession?.user?.email);
    
    session.set(currentSession);
    user.set(currentSession?.user ?? null);
    
    if (event === 'SIGNED_IN' && currentSession) {
      // Set cookies for server-side access
      document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${currentSession.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      console.log('[Auth] Cookies set for server-side access');
      
      // Ensure user profile exists
      if (currentSession.user) {
        await ensureUserProfile(currentSession.user);
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      console.log('[Auth] Cookies cleared');
    }
  });
  
  loading.set(false);
}

// Ensure user profile exists in our users table
async function ensureUserProfile(authUser: User) {
  console.log('[Auth] Checking user profile for:', authUser.email);
  
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('id', authUser.id)
    .single();
  
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('[Auth] Error checking user profile:', selectError);
    return;
  }
  
  if (!existingUser) {
    console.log('[Auth] Creating user profile for:', authUser.email);
    
    // Create user profile if it doesn't exist
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email!.split('@')[0]
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('[Auth] Error creating user profile:', insertError);
      console.error('[Auth] User ID:', authUser.id);
      console.error('[Auth] User Email:', authUser.email);
    } else {
      console.log('[Auth] User profile created successfully:', newUser);
    }
  } else {
    console.log('[Auth] User profile exists:', existingUser);
  }
}

// Auth functions
export async function signInWithMagicLink(email: string) {
  // Use environment variable for redirect URL, fallback to current origin
  const redirectUrl = env.PUBLIC_APP_URL || window.location.origin;
  
  console.log('[Auth] Sending magic link to:', email, 'redirect:', redirectUrl);
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${redirectUrl}/auth/callback`
    }
  });
  
  if (error) {
    console.error('[Auth] Magic link error:', error);
    throw error;
  }
  
  console.log('[Auth] Magic link sent successfully');
  return { success: true };
}

export async function signOut() {
  console.log('[Auth] Signing out...');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Auth] Sign out error:', error);
    throw error;
  }
  console.log('[Auth] Signed out successfully');
}

// Get current user ID for API calls
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUserId() !== null;
}
