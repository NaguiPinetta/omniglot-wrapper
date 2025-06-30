import type { Handle } from '@sveltejs/kit';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';

// Protected routes that require authentication
const protectedRoutes = ['/agents', '/datasets', '/jobs', '/glossary', '/modules', '/models'];

export const handle: Handle = async ({ event, resolve }) => {
  // Create Supabase client for this request
  const supabase = await createServerSupabaseClient(event);
  
  // Try to get session from cookies first
  const accessToken = event.cookies.get('sb-access-token');
  const refreshToken = event.cookies.get('sb-refresh-token');
  
  let session = null;
  
  if (accessToken && refreshToken) {
    // Set session from cookies
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    if (!error && data.session) {
      session = data.session;
    }
  }
  
  // Fallback to getSession if no cookies
  if (!session) {
    const { data: { session: fallbackSession } } = await supabase.auth.getSession();
    session = fallbackSession;
  }
  
  // Add session to locals for use in pages
  event.locals.session = session;
  event.locals.user = session?.user ?? null;
  
  // Check if route is protected and user is not authenticated
  const isProtectedRoute = protectedRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !session) {
    console.log(`Redirecting to login - protected route: ${event.url.pathname}, session: ${!!session}`);
    throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
  }
  
	return resolve(event);
};
