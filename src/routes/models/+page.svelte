<script lang="ts">
	import { onMount } from 'svelte';
	import { modelStore } from '../../stores/models';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import type { ApiKeyFormData } from '../../types/models';
	import type { PageData } from './$types';
	import { getUsageStats } from '../../lib/usage/api';
	import type { UsageStats } from '../../lib/usage/api';
	import { logger } from '$lib/utils/logger';

	export let data: PageData;

	let showApiKeyDialog = false;
	let selectedProvider = '';
	let apiKeyForm: ApiKeyFormData = {
		provider: '',
		key_value: '',
		name: ''
	};

	const providers = [
		{ value: 'openai', label: 'OpenAI' },
		{ value: 'deepseek', label: 'DeepSeek' },
		{ value: 'mistral', label: 'Mistral' },
		{ value: 'gemini', label: 'Gemini' },
		{ value: 'custom', label: 'Custom' }
	];

	// Usage statistics
	let usageStats: UsageStats[] = [];
	let loadingUsage = false;

	// Sync models state
	let syncingModels = false;
	let syncMessage = '';
	let syncError = '';

	// Load usage statistics
	async function loadUsageStats() {
		loadingUsage = true;
		try {
			usageStats = await getUsageStats();
		} catch (error: any) {
			logger.error('Failed to load usage stats', error);
		} finally {
			loadingUsage = false;
		}
	}

	// Sync OpenAI models
	async function handleSyncModels() {
		const syncLogger = logger.scope('ModelSync');
		syncLogger.info('Starting models sync');
		
		syncingModels = true;
		syncMessage = '';
		syncError = '';

		try {
			const response = await fetch('/api/models/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || `HTTP ${response.status}`);
			}

			syncLogger.info('Models sync completed', result.results);
			syncMessage = result.message;
			
			// Reload models to show the new ones
			await modelStore.loadModels();
			
		} catch (error: any) {
			syncLogger.error('Models sync failed', error);
			syncError = error.message || 'Failed to sync models. Please try again.';
		} finally {
			syncingModels = false;
			
			// Clear messages after 5 seconds
			setTimeout(() => {
				syncMessage = '';
				syncError = '';
			}, 5000);
		}
	}

	// Load data on mount
	onMount(async () => {
		await Promise.all([
			modelStore.loadApiKeys(),
			modelStore.loadModels(),
			loadUsageStats()
		]);
	});

	async function handleAddApiKey() {
		const apiKeyLogger = logger.scope('ApiKeyAdd');
		apiKeyLogger.debug('Adding API key', { provider: apiKeyForm.provider, hasKey: !!apiKeyForm.key_value });
		
		if (!apiKeyForm.provider || !apiKeyForm.key_value) {
			apiKeyLogger.warn('Form validation failed', { 
				hasProvider: !!apiKeyForm.provider, 
				hasKey: !!apiKeyForm.key_value 
			});
			return;
		}
		
		await modelStore.addApiKey(apiKeyForm);
		
		if (!$modelStore.error) {
			apiKeyLogger.info('API key added successfully');
			apiKeyForm = { provider: '', key_value: '', name: '' };
			showApiKeyDialog = false;
		} else {
			apiKeyLogger.error('API key addition failed', { error: $modelStore.error });
		}
	}

	async function handleDeleteApiKey(id: string) {
		if (confirm('Are you sure you want to delete this API key?')) {
			await modelStore.deleteApiKey(id);
		}
	}

	function maskApiKey(key: string): string {
		if (key.length <= 8) return '***';
		return key.substring(0, 4) + '***' + key.substring(key.length - 4);
	}

	function getProviderLabel(value: string): string {
		return providers.find(p => p.value === value)?.label || value;
	}

	// Filter models by selected provider
	$: filteredModels = selectedProvider 
		? $modelStore.models.filter(model => model.provider === selectedProvider)
		: $modelStore.models;
</script>

<svelte:head>
	<title>API Keys & Models - Omniglot</title>
	<meta name="description" content="Manage API keys and view available AI models" />
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">API Keys & Models</h1>
		<p class="text-gray-600 mt-2">
			Manage your API keys and view available AI models
		</p>
	</div>

	{#if $modelStore.error || (data && data.error)}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
				</svg>
				<div>
					<p class="font-medium">Connection Error</p>
					<p class="text-sm">{$modelStore.error || data.error}</p>
					<p class="text-sm mt-1">Please make sure the database tables are created. You can still add API keys once the connection is restored.</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- API Keys Manager -->
		<Card>
			<CardHeader>
				<CardTitle>API Keys Manager</CardTitle>
				<CardDescription>
					Store and manage your AI provider API keys securely
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex justify-between items-center mb-4">
						<h3 class="text-lg font-medium">Saved Keys</h3>
						<button 
							class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							on:click={() => {
								apiKeyForm = { provider: '', key_value: '', name: '' };
								showApiKeyDialog = true;
							}}
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							Add API Key
						</button>
					</div>

					<!-- API Key Modal -->
					{#if showApiKeyDialog}
						<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
							<div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
								<div class="flex justify-between items-center mb-4">
									<h3 class="text-lg font-medium text-gray-900">Add API Key</h3>
									<button 
										on:click={() => showApiKeyDialog = false}
										class="text-gray-400 hover:text-gray-600"
										aria-label="Close dialog"
									>
										<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
										</svg>
									</button>
								</div>
								<form on:submit|preventDefault={handleAddApiKey} class="space-y-4">
									{#if $modelStore.error}
										<div class="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
											<div class="flex items-center">
												<svg class="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
												</svg>
												<p class="text-sm">{$modelStore.error}</p>
											</div>
										</div>
									{/if}
									<div>
										<label for="api-key-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
										<input
											id="api-key-name"
											type="text"
											placeholder="e.g., 'Main OpenAI Key'"
											bind:value={apiKeyForm.name}
											required
											minlength="1"
											class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label for="provider" class="block text-sm font-medium text-gray-700 mb-1">Provider</label>
										<select
											id="provider"
											bind:value={apiKeyForm.provider}
											class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
											required
										>
											<option value="">Select a provider</option>
											{#each providers as provider}
												<option value={provider.value}>{provider.label}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="api-key" class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
										<input
											id="api-key"
											type="password"
											placeholder="Enter your API key"
											bind:value={apiKeyForm.key_value}
											class="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
											required
										/>
									</div>
									<div class="flex justify-end gap-2 pt-4">
										<button 
											type="button" 
											on:click={() => showApiKeyDialog = false}
											class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
										>
											Cancel
										</button>
										<button 
											type="submit"
											on:click={handleAddApiKey}
											disabled={$modelStore.loading || !apiKeyForm.provider || !apiKeyForm.key_value || !apiKeyForm.name}
											class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
										>
											{$modelStore.loading ? 'Saving...' : 'Save Key'}
										</button>
									</div>
								</form>
							</div>
						</div>
					{/if}

					{#if $modelStore.loading && $modelStore.apiKeys.length === 0}
						<div class="text-center py-4">
							<div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
							<p class="mt-2 text-sm text-gray-500">Loading API keys...</p>
						</div>
					{:else if $modelStore.apiKeys.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No API keys configured</p>
							<p class="text-sm">Add your first API key to get started</p>
						</div>
					{:else}
						<div class="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Provider</TableHead>
										<TableHead>Key</TableHead>
										<TableHead>Created</TableHead>
										<TableHead class="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each $modelStore.apiKeys as apiKey (apiKey.id)}
										<TableRow>
											<TableCell class="font-medium">
												{apiKey.name}
											</TableCell>
											<TableCell class="font-medium">
												{getProviderLabel(apiKey.provider)}
											</TableCell>
											<TableCell class="font-mono text-sm">
												{maskApiKey(apiKey.key_value)}
											</TableCell>
											<TableCell class="text-sm text-gray-500">
												{new Date(apiKey.created_at).toLocaleDateString()}
											</TableCell>
											<TableCell class="text-right">
												<Button 
													variant="danger" 
													size="sm" 
													on:click={() => handleDeleteApiKey(apiKey.id)}
												>
													Delete
												</Button>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Usage Statistics -->
		<Card>
			<CardHeader>
				<CardTitle>Free Tier Usage</CardTitle>
				<CardDescription>
					Daily usage limits for free and demo models
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if loadingUsage}
						<div class="text-center py-4">
							<div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
							<p class="mt-2 text-sm text-gray-500">Loading usage stats...</p>
						</div>
					{:else if usageStats.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No free tier models available</p>
							<p class="text-sm">Free and demo models will appear here when available</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each usageStats as stat}
								<div class="border rounded-lg p-4">
									<div class="flex justify-between items-center mb-2">
										<h4 class="font-medium">{stat.model_name}</h4>
										<span class="text-sm {stat.can_use ? 'text-green-600' : 'text-red-600'}">
											{stat.can_use ? '✅ Available' : '❌ Limit Reached'}
										</span>
									</div>
									<div class="flex justify-between text-sm text-gray-600 mb-2">
										<span>Usage Today</span>
										<span>{stat.used_today} / {stat.daily_limit}</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
										<div 
											class="h-2 rounded-full {stat.can_use ? 'bg-blue-600' : 'bg-red-600'}"
											style="width: {Math.min(100, (stat.used_today / stat.daily_limit) * 100)}%"
										></div>
									</div>
									<p class="text-xs text-gray-500">
										{stat.remaining} requests remaining today
									</p>
								</div>
							{/each}
						</div>
					{/if}

					<div class="flex justify-end">
						<Button 
							variant="secondary" 
							size="sm" 
							on:click={loadUsageStats}
							disabled={loadingUsage}
						>
							{loadingUsage ? 'Refreshing...' : 'Refresh Usage'}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Available Models -->
		<Card>
			<CardHeader>
				<div class="flex justify-between items-center">
					<div>
						<CardTitle>Available Models</CardTitle>
						<CardDescription>
							Browse AI models available for translation tasks
						</CardDescription>
					</div>
					<button 
						class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md border border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
						on:click={handleSyncModels}
						disabled={syncingModels}
					>
						{#if syncingModels}
							<div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
							Syncing...
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							Sync Models
						{/if}
					</button>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#if syncMessage}
						<div class="bg-green-50 border border-green-200 rounded-md p-4 text-green-700">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
								</svg>
								<p class="text-sm">{syncMessage}</p>
							</div>
						</div>
					{/if}

					{#if syncError}
						<div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
								</svg>
								<p class="text-sm">{syncError}</p>
							</div>
						</div>
					{/if}

					<!-- Provider Filter -->
					<div>
						<label for="provider-filter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Provider</label>
						<select
							id="provider-filter"
							bind:value={selectedProvider}
							class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="">All Providers</option>
							{#each providers as provider}
								<option value={provider.value}>{provider.label}</option>
							{/each}
						</select>
					</div>

					{#if $modelStore.loading && $modelStore.models.length === 0}
						<div class="text-center py-4">
							<div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
							<p class="mt-2 text-sm text-gray-500">Loading models...</p>
						</div>
					{:else if filteredModels.length === 0}
						<div class="text-center py-8 text-gray-500">
							<p>No models found</p>
							{#if selectedProvider}
								<p class="text-sm">No models available for {getProviderLabel(selectedProvider)}</p>
							{/if}
						</div>
					{:else}
						<div class="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Model</TableHead>
										<TableHead>Provider</TableHead>
										<TableHead>Context</TableHead>
										<TableHead>Description</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each filteredModels as model (model.id)}
										<TableRow>
											<TableCell class="font-medium">
												{model.name}
											</TableCell>
											<TableCell>
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
													{getProviderLabel(model.provider)}
												</span>
											</TableCell>
											<TableCell class="text-sm text-gray-500">
												{model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'N/A'}
											</TableCell>
											<TableCell class="text-sm text-gray-600">
												{model.description || 'No description available'}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</main> 