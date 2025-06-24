<script lang="ts">
	export let data;
</script>

<svelte:head>
	<title>Debug - Connection Test</title>
</svelte:head>

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-4">Direct Supabase Connection Test</h1>
	
	<div class="mb-6">
		<h2 class="text-lg font-semibold mb-2">Environment:</h2>
		<div class="bg-gray-100 p-4 rounded">
			<p><strong>URL:</strong> {data.env.url}</p>
			<p><strong>Key Length:</strong> {data.env.keyLength}</p>
			{#if data.url}
				<p><strong>Test URL:</strong> {data.url}</p>
			{/if}
		</div>
	</div>
	
	{#if data.success}
		<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
			<strong>✅ Success!</strong> Direct connection to Supabase works.
		</div>
		
		<h2 class="text-lg font-semibold mb-2">Response Data:</h2>
		<pre class="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(data.data, null, 2)}</pre>
	{:else}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			<strong>❌ Error:</strong> {data.error}
		</div>
		
		{#if data.details}
			<h2 class="text-lg font-semibold mb-2">Error Details:</h2>
			<pre class="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(data.details, null, 2)}</pre>
		{/if}
	{/if}
</div> 