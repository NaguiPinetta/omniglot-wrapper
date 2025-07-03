<script lang="ts">
	import type { PageData } from './$types';
	import { supabaseClient } from '$lib/supabaseClient';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let data: PageData;

	let user: any = null;
	let session: any = null;
	let debugInfo: any = {};
	let magicLinkEmail = 'jpinetta@descartes.com';
	let magicLinkStatus = '';
	let magicLinkError = '';

	async function testMagicLink() {
		magicLinkStatus = 'Sending...';
		magicLinkError = '';
		
		try {
			const redirectUrl = 'https://omniglot-wrapper.vercel.app/auth/callback';
			console.log('Testing magic link with redirect:', redirectUrl);
			
			const { error } = await supabaseClient.auth.signInWithOtp({
				email: magicLinkEmail,
				options: {
					emailRedirectTo: redirectUrl
				}
			});
			
			if (error) {
				console.error('Magic link error:', error);
				magicLinkError = `Error: ${error.message}`;
				magicLinkStatus = 'Failed';
			} else {
				magicLinkStatus = 'Sent successfully! Check your email.';
				console.log('Magic link sent successfully');
			}
		} catch (err) {
			console.error('Magic link exception:', err);
			magicLinkError = `Exception: ${err}`;
			magicLinkStatus = 'Failed';
		}
	}
</script>

<svelte:head>
	<title>Debug Authentication</title>
</svelte:head>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Debug Authentication & Data</h1>
	
	<div class="space-y-6">
		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-3">Current User Session</h2>
			<pre class="text-sm overflow-x-auto">{JSON.stringify(data.debug.currentUser, null, 2)}</pre>
			{#if data.debug.userError}
				<div class="text-red-600 mt-2">
					<strong>User Error:</strong> {JSON.stringify(data.debug.userError, null, 2)}
				</div>
			{/if}
		</div>
		
		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-3">User Profile (public.users)</h2>
			<pre class="text-sm overflow-x-auto">{JSON.stringify(data.debug.userProfile, null, 2)}</pre>
			{#if data.debug.profileError}
				<div class="text-red-600 mt-2">
					<strong>Profile Error:</strong> {JSON.stringify(data.debug.profileError, null, 2)}
				</div>
			{/if}
		</div>
		
		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-3">Data Counts</h2>
			<ul class="space-y-2">
				<li><strong>Jobs:</strong> {data.debug.jobsCount ?? 'Error'}</li>
				<li><strong>Agents:</strong> {data.debug.agentsCount ?? 'Error'}</li>
				<li><strong>Datasets:</strong> {data.debug.datasetsCount ?? 'Error'}</li>
			</ul>
			
			{#if data.debug.jobsError}
				<div class="text-red-600 mt-2">
					<strong>Jobs Error:</strong> {JSON.stringify(data.debug.jobsError, null, 2)}
				</div>
			{/if}
			
			{#if data.debug.agentsError}
				<div class="text-red-600 mt-2">
					<strong>Agents Error:</strong> {JSON.stringify(data.debug.agentsError, null, 2)}
				</div>
			{/if}
			
			{#if data.debug.datasetsError}
				<div class="text-red-600 mt-2">
					<strong>Datasets Error:</strong> {JSON.stringify(data.debug.datasetsError, null, 2)}
				</div>
			{/if}
		</div>
		
		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-3">Sample Data (All Users)</h2>
			<div class="space-y-4">
				<div>
					<h3 class="font-semibold">Jobs Sample:</h3>
					<pre class="text-sm overflow-x-auto">{JSON.stringify(data.debug.allJobsSample, null, 2)}</pre>
					{#if data.debug.allJobsError}
						<div class="text-red-600 mt-2">
							<strong>All Jobs Error:</strong> {JSON.stringify(data.debug.allJobsError, null, 2)}
						</div>
					{/if}
				</div>
				
				<div>
					<h3 class="font-semibold">Agents Sample:</h3>
					<pre class="text-sm overflow-x-auto">{JSON.stringify(data.debug.allAgentsSample, null, 2)}</pre>
					{#if data.debug.allAgentsError}
						<div class="text-red-600 mt-2">
							<strong>All Agents Error:</strong> {JSON.stringify(data.debug.allAgentsError, null, 2)}
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-3">Key Information</h2>
			<ul class="space-y-1">
				<li><strong>Session User ID:</strong> {data.debug.sessionUserId}</li>
				<li><strong>User Email:</strong> {data.debug.userEmail}</li>
			</ul>
		</div>
		
		{#if data.debug.error}
			<div class="bg-red-100 p-4 rounded-lg">
				<h2 class="text-xl font-semibold mb-3 text-red-800">Error</h2>
				<p class="text-red-700">{data.debug.error}</p>
			</div>
		{/if}
	</div>

	<!-- Magic Link Test Section -->
	<div class="bg-blue-50 p-4 rounded-lg mb-6">
		<h2 class="text-lg font-semibold mb-3">Magic Link Test</h2>
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium mb-1">Email:</label>
				<input 
					type="email" 
					bind:value={magicLinkEmail}
					class="w-full p-2 border rounded"
					placeholder="Enter email address"
				/>
			</div>
			<button 
				on:click={testMagicLink}
				class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
			>
				Send Test Magic Link
			</button>
			{#if magicLinkStatus}
				<div class="text-sm">
					<strong>Status:</strong> {magicLinkStatus}
				</div>
			{/if}
			{#if magicLinkError}
				<div class="text-sm text-red-600">
					<strong>Error:</strong> {magicLinkError}
				</div>
			{/if}
		</div>
	</div>
</div>
