import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '$env/static/private';

// Protected routes that require authentication
const protectedRoutes = ['/agents', '/datasets', '/jobs', '/glossary', '/modules', '/models'];

export const handle: Handle = async ({ event, resolve }) => {
  // Create a simple Supabase clint for authentication
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Try to get session from cookies first
  const accessToken = event.cookies.get('sb-access-token');
  const refreshToken = event.cookies.get('sb-refresh-token');
  
  let session = null;
  
  // Debug logging for authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    console.log(`[Server Auth] Route: ${event.url.pathname}`);
    console.log(`[Server Auth] Access token present: ${!!accessToken}`);
    console.log(`[Server Auth] Refresh token present: ${!!refreshToken}`);
  }
  
  if (accessToken && refreshToken) {
    // Set session from cookies
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!error && data.session) {
      session = data.session;
      if (isProtectedRoute) {
        console.log(`[Server Auth] Session restored from cookies for user: ${session.user.email}`);
      }
    } else {
      if (isProtectedRoute) {
        console.log(`[Server Auth] Failed to restore session from cookies:`, error?.message);
      }
    }
  }
  
  // Fallback to getSession if no cookies (shouldn't happen but just in case)
  if (!session) {
    const { data: { session: fallbackSession } } = await supabase.auth.getSession();
    if (fallbackSession) {
      session = fallbackSession;
      if (isProtectedRoute) {
        console.log(`[Server Auth] Session found via getSession fallback for user: ${session.user.email}`);
      }
    } else {
      if (isProtectedRoute) {
        console.log(`[Server Auth] No session found via getSession fallback`);
      }
    }
  }
  
  // Add session to locals for use in pages
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  
  if (isProtectedRoute && !session) {
    console.log(`[Server Auth] Redirecting to login - protected route: ${event.url.pathname}, session: ${!!session}`);
    throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
  }
  
  if (session && isProtectedRoute) {
    console.log(`[Server Auth] Authenticated user ${session.user.email} accessing ${event.url.pathname}`);
  }
  
	return resolve(event);
};
