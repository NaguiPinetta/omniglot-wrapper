<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initAuth, user, loading, signOut } from '$lib/auth/client';
	import Button from '$lib/components/ui/Button.svelte';

	onMount(() => {
		initAuth();
	});

	async function handleSignOut() {
		console.log('Sign out button clicked');
		try {
			console.log('Attempting to sign out...');
			await signOut();
			console.log('Sign out successful');
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<span class="text-xl font-bold text-gray-800">Omniglot</span>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a href="/" 
							class="{$page.url.pathname === '/' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Home
						</a>
						<a href="/agents" 
							class="{$page.url.pathname === '/agents' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Agents
						</a>
						<a href="/test" 
							class="{$page.url.pathname === '/test' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Test Bench
						</a>
						<a href="/glossary" 
							class="{$page.url.pathname === '/glossary' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Glossary
						</a>
						<a href="/modules" 
							class="{$page.url.pathname === '/modules' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Modules
						</a>
						<a href="/jobs" 
							class="{$page.url.pathname === '/jobs' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Jobs
						</a>
						<a href="/datasets" 
							class="{$page.url.pathname === '/datasets' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Datasets
						</a>
						<a href="/models" 
							class="{$page.url.pathname === '/models' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
							Models
						</a>
					</div>
				</div>
				<div class="flex items-center space-x-4">
					{#if $loading}
						<div class="text-sm text-gray-500">Loading...</div>
					{:else if $user}
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-700">
								Welcome, {$user.email}
							</span>
							<Button variant="secondary" size="sm" on:click={handleSignOut}>
								Sign Out
							</Button>
						</div>
					{:else}
						<a href="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
							Sign In
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Page Content -->
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>
