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
      // Get the current URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for auth tokens in URL or fragment
      const accessToken = urlParams.get('access_token') || fragment.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || fragment.get('refresh_token');
      const tokenType = urlParams.get('token_type') || fragment.get('token_type');
      
      console.log('Callback page - tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken, tokenType });
      
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