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
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, currentSession) => {
    session.set(currentSession);
    user.set(currentSession?.user ?? null);
    
    if (event === 'SIGNED_IN' && currentSession) {
      // Set cookies for server-side access
      document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${currentSession.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Ensure user profile exists
      if (currentSession.user) {
        await ensureUserProfile(currentSession.user);
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  });
  
  loading.set(false);
}

// Ensure user profile exists in our users table
async function ensureUserProfile(authUser: User) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();
  
  if (!existingUser) {
    // Create user profile if it doesn't exist
    const { error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email!.split('@')[0]
      });
    
    if (error) {
      console.error('Error creating user profile:', error);
    }
  }
}

// Auth functions
export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    throw error;
  }
  
  return { success: true };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
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