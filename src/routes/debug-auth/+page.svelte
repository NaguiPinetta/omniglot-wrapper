<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
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
</div>
