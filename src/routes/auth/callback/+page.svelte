<!-- Auth Callback Page -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/auth/client';
  import { page } from '$app/stores';
  
  let status = 'Processing authentication...';
  let error = '';
  
  onMount(async () => {
    try {
      // Debug: Log the full URL
      const fullUrl = window.location.href;
      console.log('[Auth Callback] Full URL:', fullUrl);
      
      // Get the current URL parameters and hash
      const urlParams = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.substring(1));
      
      // Debug: Log all parameters
      console.log('[Auth Callback] URL params:', Object.fromEntries(urlParams));
      console.log('[Auth Callback] Fragment params:', Object.fromEntries(fragment));
      
      // Check for auth tokens in URL or fragment
      const accessToken = urlParams.get('access_token') || fragment.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || fragment.get('refresh_token');
      const tokenType = urlParams.get('token_type') || fragment.get('token_type');
      const errorParam = urlParams.get('error') || fragment.get('error');
      const errorDescription = urlParams.get('error_description') || fragment.get('error_description');
      
      console.log('[Auth Callback] Tokens found:', { 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken, 
        tokenType, 
        error: errorParam,
        errorDescription 
      });
      
      // Check for auth errors first
      if (errorParam) {
        error = `Authentication error: ${errorParam}`;
        if (errorDescription) {
          error += ` - ${errorDescription}`;
        }
        status = 'Authentication failed';
        console.error('[Auth Callback] Auth error from Supabase:', errorParam, errorDescription);
        return;
      }
      
      if (accessToken && refreshToken) {
        // Set the session using the tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          error = sessionError.message;
          status = 'Authentication failed';
        } else if (data.session) {
          console.log('Session established successfully');
          
          // Manually set cookies for server-side access
          const cookieOptions = `path=/; max-age=3600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          const refreshCookieOptions = `path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          
          document.cookie = `sb-access-token=${data.session.access_token}; ${cookieOptions}`;
          document.cookie = `sb-refresh-token=${data.session.refresh_token}; ${refreshCookieOptions}`;
          
          console.log('[Auth Callback] Cookies set:', {
            accessToken: `sb-access-token=${data.session.access_token.substring(0, 20)}...`,
            refreshToken: `sb-refresh-token=${data.session.refresh_token.substring(0, 20)}...`,
            options: cookieOptions
          });
          
          status = 'Authentication successful! Redirecting...';
          
          // Wait a moment then redirect
          setTimeout(() => {
            goto('/', { replaceState: true });
          }, 1000);
        } else {
          error = 'No session created';
          status = 'Authentication failed';
        }
      } else {
        // Check if we're already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Already authenticated, redirecting...');
          
          // Ensure cookies are set for existing session
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          
          status = 'Already authenticated! Redirecting...';
          goto('/', { replaceState: true });
        } else {
          error = 'No authentication tokens found';
          status = 'Authentication failed';
          
          // Redirect to login after a delay
          setTimeout(() => {
            goto('/login?error=auth_callback_failed', { replaceState: true });
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Callback error:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      status = 'Authentication failed';
      
      setTimeout(() => {
        goto('/login?error=auth_callback_error', { replaceState: true });
      }, 3000);
    }
  });
</script>

<svelte:head>
  <title>Authenticating - Omniglot</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full text-center space-y-4">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    
    <h2 class="text-xl font-semibold text-gray-900">
      {status}
    </h2>
    
    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p class="font-medium">Authentication Error</p>
        <p class="text-sm">{error}</p>
        <p class="text-sm mt-2">Redirecting to login page...</p>
      </div>
    {/if}
    
    {#if !error}
      <p class="text-gray-600">Please wait while we complete your sign-in...</p>
    {/if}
  </div>
</div> 