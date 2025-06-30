<script lang="ts">
  import { signInWithMagicLink } from '$lib/auth/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';

  let email = '';
  let loading = false;
  let message = '';
  let error = '';

  $: {
    const errorParam = $page.url.searchParams.get('error');
    const details = $page.url.searchParams.get('details');
    
    if (errorParam === 'auth_failed') {
      error = 'Authentication failed. Please try again.';
    } else if (errorParam === 'auth_exchange_failed') {
      error = `Authentication failed: ${details || 'Unknown error'}`;
    } else if (errorParam === 'no_code') {
      error = 'No authentication code received. Please try again.';
    } else if (errorParam) {
      error = `Authentication error: ${errorParam}`;
    }
  }

  async function handleLogin() {
    if (!email) {
      error = 'Please enter your email address.';
      return;
    }

    loading = true;
    error = '';
    message = '';

    try {
      await signInWithMagicLink(email);
      message = 'Check your email for a magic link to sign in!';
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred during login.';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: CustomEvent<KeyboardEvent>) {
    if (event.detail.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>Login - Omniglot</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to Omniglot
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email to receive a magic link
      </p>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Magic Link Authentication</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        {/if}
        
        {#if message}
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        {/if}
        
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              bind:value={email}
              placeholder="Enter your email"
              disabled={loading}
              on:keypress={handleKeyPress}
              class="mt-1"
            />
          </div>
          
          <Button
            on:click={handleLogin}
            disabled={loading || !email}
            class="w-full"
          >
            {#if loading}
              Sending magic link...
            {:else}
              Send Magic Link
            {/if}
          </Button>
        </div>
        
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account? No problem! Just enter your email and we'll create one for you.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</div> 