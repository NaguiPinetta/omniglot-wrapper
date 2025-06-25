<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { jobStore } from '../../stores/jobs';
	import { agentStore } from '../../stores/agents';
	import { datasetStore } from '../../stores/datasets';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { JobFormData, Job } from '../../types/jobs';
	import type { PageData } from './$types';

	export let data: PageData;

	let showModal = false;
	let formData: JobFormData = {
		name: '',
		description: '',
		agent_id: '',
		dataset_id: '',
		glossary_id: null,
		source_language: 'en',
		translation_instructions: '',
		target_language: ''
	};

	// Column mapping state
	let selectedDatasetPreview: any[] = [];
	let availableColumns: string[] = [];
	let columnMapping = {
		source_text_column: '',
		source_language_column: '',
		row_id_column: ''
	};
	let loadingPreview = false;

	// Polling interval for job list refresh
	let pollingInterval: NodeJS.Timeout;

	// Initialize stores with server data
	onMount(() => {
		if (data.jobs) jobStore.set({ jobs: data.jobs, loading: false, error: data.error || null });
		if (data.agents) agentStore.set({ agents: data.agents, loading: false, error: null });
		if (data.datasets) datasetStore.set({ datasets: data.datasets, loading: false, error: null });
		// Immediately fetch jobs on mount
		jobStore.loadJobs();
		// Set up polling every 5 seconds
		pollingInterval = setInterval(() => {
			jobStore.loadJobs();
		}, 5000);
	});

	onDestroy(() => {
		clearInterval(pollingInterval);
	});

	async function handleSubmit() {
		console.log('=== JOB CREATION DEBUG START ===');
		console.log('Form data:', formData);
		console.log('Column mapping:', columnMapping);
		console.log('Agent store state:', { 
			agents: $agentStore.agents, 
			loading: $agentStore.loading, 
			error: $agentStore.error 
		});
		console.log('Dataset store state:', { 
			datasets: $datasetStore.datasets, 
			loading: $datasetStore.loading, 
			error: $datasetStore.error 
		});
		console.log('Job store state:', { 
			jobs: $jobStore.jobs, 
			loading: $jobStore.loading, 
			error: $jobStore.error 
		});
		
		// Validate required column mapping
		if (!columnMapping.source_text_column) {
			console.error('Validation failed: No source text column selected');
			alert('Please select a Source Text Column');
			return;
		}
		
		// Validate at least one target language
		if (!formData.target_language) {
			alert('Please select a target language.');
			return;
		}
		
		// Get the selected agent's prompt
		const selectedAgent = $agentStore.agents.find(a => a.id === formData.agent_id);
		console.log('Selected agent:', selectedAgent);
		
		const agentPrompt = selectedAgent?.prompt || '';
		
		// Combine agent prompt with user instructions
		let finalInstructions = agentPrompt;
		if (formData.translation_instructions) {
			finalInstructions += '\n\nAdditional Instructions: ' + formData.translation_instructions;
		}
		
		// Create enhanced job data with column mapping
		const enhancedJobData = {
			...formData,
			translation_instructions: finalInstructions,
			column_mapping: columnMapping
		};
		
		console.log('Final job data to submit:', enhancedJobData);
		
		if (!formData.name || formData.name.trim() === '') {
			console.error('Validation failed: No job name entered');
			alert('Please enter a job name.');
			return;
		}
		
		try {
			console.log('Calling jobStore.addJob...');
			await jobStore.addJob(enhancedJobData);
			console.log('jobStore.addJob completed');
			
			if ($jobStore.error) {
				console.error('Job store has error:', $jobStore.error);
				alert(`Failed to create job: ${$jobStore.error}`);
			} else {
				console.log('Job creation successful, resetting form...');
				resetForm();
				showModal = false;
			}
		} catch (error) {
			console.error('Exception during job creation:', error);
			alert(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
		
		console.log('=== JOB CREATION DEBUG END ===');
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			agent_id: '',
			dataset_id: '',
			glossary_id: null,
			source_language: 'en',
			translation_instructions: '',
			target_language: ''
		};
		
		// Reset column mapping
		columnMapping = {
			source_text_column: '',
			source_language_column: '',
			row_id_column: ''
		};
		
		selectedDatasetPreview = [];
		availableColumns = [];
	}

	function openModal() {
		resetForm();
		showModal = true;
	}

	function getStatusColor(status: Job['status']) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'queued': return 'bg-yellow-100 text-yellow-800'; // Support legacy status
			case 'running': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'failed': return 'bg-red-100 text-red-800';
			case 'cancelled': return 'bg-gray-100 text-gray-800';
			case 'paused': return 'bg-orange-100 text-orange-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getAgentName(id: string) {
		return $agentStore.agents.find(a => a.id === id)?.custom_name || 'Unknown Agent';
	}

	function getDatasetName(id: string) {
		return $datasetStore.datasets.find(d => d.id === id)?.name || 'Unknown Dataset';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	let showResultsModal = false;
	let selectedJobResults: any[] = [];
	let selectedJobName = '';
	let selectedJobSkippedRows: any[] = [];
	let showSkippedRows = false;

	async function viewResults(jobId: string) {
		try {
			// Import the getJobResults function
			const { getJobResults } = await import('../../lib/jobs/api');
			selectedJobResults = await getJobResults(jobId);
			const job = $jobStore.jobs.find(j => j.id === jobId);
			selectedJobName = job?.name || 'Unknown Job';
			
			// Load skipped rows from job record (if any)
			selectedJobSkippedRows = job?.skipped_rows || [];
			
			showResultsModal = true;
		} catch (error) {
			console.error('Failed to load job results:', error);
		}
	}

	async function downloadResults(jobId: string) {
		try {
			const { getJobResults } = await import('../../lib/jobs/api');
			const results = await getJobResults(jobId);
			const job = $jobStore.jobs.find(j => j.id === jobId);
			
			// Convert results to CSV format
			const csvContent = [
				'Source Text,Target Text,Source Language,Target Language,Confidence,Status',
				...results.map(r => `"${r.source_text}","${r.target_text}","${r.source_language}","${r.target_language}",${r.confidence},"${r.status}"`)
			].join('\n');
			
			// Create and download file
			const blob = new Blob([csvContent], { type: 'text/csv' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${job?.name || 'job'}_results.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to download results:', error);
		}
	}

	async function retryJob(jobId: string) {
		const job = $jobStore.jobs.find(j => j.id === jobId);
		if (job) {
			// Reset the job to pending status and clear error
			await jobStore.updateJob(jobId, {
				status: 'pending',
				error: null,
				progress: 0,
				processed_items: 0,
				failed_items: 0,
				started_at: null,
				completed_at: null
			});
		}
	}

	async function loadDatasetPreview(datasetId: string) {
		if (!datasetId) {
			selectedDatasetPreview = [];
			availableColumns = [];
			return;
		}

		loadingPreview = true;
		try {
			// Import the getDatasetPreview function to get real CSV data
			const { getDatasetPreview } = await import('../../lib/datasets/api');
			const preview = await getDatasetPreview(datasetId);
			
			selectedDatasetPreview = preview.rows;
			availableColumns = preview.headers;
			
			console.log('Loaded real dataset preview:', preview);
			console.log('Available columns:', availableColumns);
			
			// Reset column mapping
			columnMapping = {
				source_text_column: '',
				source_language_column: '',
				row_id_column: ''
			};
			
			// Auto-select common column names with intelligent matching
			const possibleTextColumns = ['text', 'content', 'source_text', 'source', 'message', 'description', 'body'];
			const possibleIdColumns = ['id', 'row_id', 'index', 'number', 'key'];
			const possibleLanguageColumns = ['language', 'lang', 'source_language', 'source_lang', 'locale'];
			
			// Find the best match for source text column
			for (const possible of possibleTextColumns) {
				const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
				if (match) {
					columnMapping.source_text_column = match;
					break;
				}
			}
			
			// If no match found, use the first column as default
			if (!columnMapping.source_text_column && availableColumns.length > 0) {
				columnMapping.source_text_column = availableColumns[0];
			}
			
			// Find the best match for row ID column
			for (const possible of possibleIdColumns) {
				const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
				if (match) {
					columnMapping.row_id_column = match;
					break;
				}
			}
			
			// Find the best match for language column
			for (const possible of possibleLanguageColumns) {
				const match = availableColumns.find(col => col.toLowerCase().includes(possible.toLowerCase()));
				if (match) {
					columnMapping.source_language_column = match;
					break;
				}
			}
			
		} catch (error) {
			console.error('Failed to load dataset preview:', error);
			// Fallback to empty state
			selectedDatasetPreview = [];
			availableColumns = [];
			
			// Show user-friendly error message
			alert('Failed to load dataset preview. The dataset may need to be re-uploaded with the new format.');
		} finally {
			loadingPreview = false;
		}
	}

	// Watch for dataset changes
	$: if (formData.dataset_id) {
		loadDatasetPreview(formData.dataset_id);
	}

	// Test function to debug job creation
	async function testJobCreation() {
		console.log('Testing job creation...');
		
		// Test with minimal data
		const testJobData = {
			name: 'Test Job',
			description: 'Test job description',
			agent_id: $agentStore.agents[0]?.id,
			dataset_id: $datasetStore.datasets[0]?.id,
			source_language: 'en',
			translation_instructions: 'Test instructions',
			column_mapping: {
				source_text_column: 'text',
				source_language_column: '',
				row_id_column: ''
			},
			target_language: 'es'
		};
		
		console.log('Test job data:', testJobData);
		
		if (!testJobData.agent_id) {
			console.error('No agents available for test');
			alert('No agents available for test');
			return;
		}
		
		if (!testJobData.dataset_id) {
			console.error('No datasets available for test');
			alert('No datasets available for test');
			return;
		}
		
		try {
			await jobStore.addJob(testJobData);
			console.log('Test job creation successful!');
			alert('Test job created successfully!');
		} catch (error) {
			console.error('Test job creation failed:', error);
			alert(`Test job creation failed: ${error}`);
		}
	}

	function getPercent(job: Job) {
		return job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0;
	}

	// Add helper to format elapsed time
	function formatElapsed(started: string | null, completed: string | null): string {
		if (!started || !completed) return '';
		const start = new Date(started);
		const end = new Date(completed);
		const ms = end.getTime() - start.getTime();
		if (ms < 0) return '';
		const sec = Math.floor(ms / 1000);
		const min = Math.floor(sec / 60);
		const remSec = sec % 60;
		return min > 0 ? `${min}m ${remSec}s` : `${remSec}s`;
	}
</script>

<svelte:head>
	<title>Jobs - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-2xl font-bold">Translation Jobs</h1>
			<p class="text-gray-600">Monitor and manage translation jobs</p>
		</div>
		<div class="flex gap-2">
			<Button on:click={openModal} disabled={$agentStore.agents.length === 0 || $datasetStore.datasets.length === 0}>
				Create Job
			</Button>
			<!-- Debug button for testing -->
			<Button variant="secondary" on:click={async () => {
				console.log('Debug - Testing job creation...');
				const testData = {
					name: 'Debug Test Job',
					description: 'Testing job creation',
					agent_id: $agentStore.agents[0]?.id || '',
					dataset_id: $datasetStore.datasets[0]?.id || '',
					source_language: 'en',
					translation_instructions: '',
					column_mapping: { source_text_column: 'text', source_language_column: '', row_id_column: '' },
					target_language: 'es'
				};
				console.log('Debug test data:', testData);
				if (!testData.agent_id || !testData.dataset_id) {
					alert('Missing agent or dataset for debug test');
					return;
				}
				try {
					await jobStore.addJob(testData);
					console.log('Debug job creation successful');
				} catch (error) {
					console.error('Debug job creation failed:', error);
				}
			}}>
				Debug Test
			</Button>
		</div>
	</div>

	<!-- Create Job Modal -->
	{#if showModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={() => showModal = false}>
			<div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Create New Job</h2>
					<button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" on:click={() => showModal = false}>×</button>
				</div>
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- Job Name Input -->
					<div class="mb-4">
						<label for="job-name" class="block text-sm font-medium mb-1">Job Name</label>
						<input
							id="job-name"
							type="text"
							placeholder="e.g., 'Translate Marketing Copy'"
							bind:value={formData.name}
							required
							minlength="1"
							class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
					
					<div>
						<label for="job-description" class="block text-sm font-medium mb-1">Description</label>
						<Textarea
							id="job-description"
							placeholder="A brief description of this translation job."
							bind:value={formData.description}
							rows={2}
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="agent" class="block text-sm font-medium mb-1">Select Agent</label>
							<select
								id="agent"
								bind:value={formData.agent_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select an agent</option>
								{#each $agentStore.agents as agent}
									<option value={agent.id}>{agent.custom_name}</option>
								{/each}
							</select>
							{#if $agentStore.agents.length === 0}
								<p class="text-xs text-gray-500 mt-1">No agents available. Create an agent first.</p>
							{/if}
						</div>
						<div>
							<label for="dataset" class="block text-sm font-medium mb-1">Select Dataset</label>
							<select
								id="dataset"
								bind:value={formData.dataset_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select a dataset</option>
								{#each $datasetStore.datasets as dataset}
									<option value={dataset.id}>{dataset.name} ({dataset.row_count} rows)</option>
								{/each}
							</select>
							{#if $datasetStore.datasets.length === 0}
								<p class="text-xs text-gray-500 mt-1">No datasets available. Upload a dataset first.</p>
							{/if}
						</div>
					</div>

					<!-- Column Mapping Section -->
					{#if formData.dataset_id}
						<div class="border-t pt-4">
							<h3 class="text-lg font-medium mb-3">📋 Map CSV Columns</h3>
							
							{#if loadingPreview}
								<p class="text-sm text-gray-500">Loading dataset preview...</p>
							{:else if availableColumns.length === 0}
								<p class="text-sm text-gray-500">No columns detected. Please select a dataset first.</p>
							{:else}
								<div class="grid grid-cols-2 gap-4 mb-4">
									<div>
										<label for="source-text-column" class="block text-sm font-medium mb-1">Source Text Column <span class="text-red-500">*</span></label>
										<select
											id="source-text-column"
											bind:value={columnMapping.source_text_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
											required
										>
											<option value="" disabled>Select source text column</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="row-id-column" class="block text-sm font-medium mb-1">Row ID Column (Optional)</label>
										<select
											id="row-id-column"
											bind:value={columnMapping.row_id_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
										>
											<option value="">None</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="source-language-column" class="block text-sm font-medium mb-1">Source Language Column (Optional)</label>
										<select
											id="source-language-column"
											bind:value={columnMapping.source_language_column}
											class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
										>
											<option value="">Use dropdown selection above</option>
											{#each availableColumns as column}
												<option value={column}>{column}</option>
											{/each}
										</select>
									</div>
								</div>

								<!-- Dataset Preview -->
								<div class="mt-4">
									<h4 class="text-sm font-medium mb-2">Dataset Preview</h4>
									<div class="overflow-x-auto max-h-40 border rounded">
										<table class="min-w-full text-xs">
											<thead class="bg-gray-50">
												<tr>
													{#each availableColumns as column}
														<th class="px-2 py-1 text-left font-medium text-gray-500 border-r">
															{column}
															{#if column === columnMapping.source_text_column}
																<span class="text-blue-600">📝</span>
															{:else if column === columnMapping.source_language_column}
																<span class="text-green-600">🌐</span>
															{:else if column === columnMapping.row_id_column}
																<span class="text-orange-600">🆔</span>
															{/if}
														</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each selectedDatasetPreview.slice(0, 3) as row}
													<tr class="border-t">
														{#each availableColumns as column}
															<td class="px-2 py-1 border-r text-gray-600 max-w-20 truncate">{row[column]}</td>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
									<p class="text-xs text-gray-500 mt-1">
										Showing first 3 rows. Icons: 📝 Source Text, 🌐 Source Lang, 🆔 Row ID
									</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Target Language Single Select -->
					<div class="mb-4">
						<label for="target_language" class="block text-sm font-medium mb-1">Target Language</label>
						<select id="target_language" bind:value={formData.target_language} required class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="">Select a language</option>
							<option value="it">Italian (it)</option>
							<option value="es">Spanish (es)</option>
							<option value="fr">French (fr)</option>
							<option value="de">German (de)</option>
							<option value="pt">Portuguese (pt)</option>
							<option value="zh">Chinese (zh)</option>
							<option value="ja">Japanese (ja)</option>
							<option value="ru">Russian (ru)</option>
							<!-- Add more as needed -->
						</select>
						<p class="text-xs text-gray-500 mt-1">Select the target language for translation.</p>
					</div>

					<!-- Translation Instructions -->
					<div>
						<label for="translation-instructions" class="block text-sm font-medium mb-1">Additional Translation Instructions (Optional)</label>
						<Textarea
							id="translation-instructions"
							placeholder="e.g., 'Maintain formal tone', 'Preserve technical terminology', 'Adapt for local market'"
							bind:value={formData.translation_instructions}
							rows={2}
						/>
						<p class="text-xs text-gray-500 mt-1">
							<strong>Note:</strong> The selected agent's custom prompt will always be used as the primary instruction. 
							These additional instructions will extend but not replace the agent's base prompt.
						</p>
					</div>

					{#if $jobStore.error}
						<p class="text-red-500 text-sm">Error: {$jobStore.error}</p>
					{/if}

					<!-- Debug Info -->
					<div class="text-xs text-gray-500 p-2 bg-gray-50 rounded">
						Debug: agents={$agentStore.agents.length}, datasets={$datasetStore.datasets.length}, loading={$jobStore.loading}
					</div>

					<div class="flex justify-end gap-2 pt-4">
						<Button type="button" on:click={() => showModal = false}>
							Cancel
						</Button>
						<Button 
							type="submit" 
							disabled={$jobStore.loading || $agentStore.agents.length === 0 || $datasetStore.datasets.length === 0 || !formData.target_language}
						>
							{$jobStore.loading ? 'Creating...' : 'Create Job'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if data.error}
		<Card class="border-red-200 bg-red-50">
			<CardContent class="py-4">
				<p class="text-red-600">Error loading data: {data.error}</p>
			</CardContent>
		</Card>
	{:else if $jobStore.loading && $jobStore.jobs.length === 0}
		<div class="text-center py-8">
			<p>Loading jobs...</p>
		</div>
	{:else if $jobStore.jobs.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
                <h3 class="text-xl font-medium">No jobs found</h3>
				<p class="text-gray-500 mt-2">Create your first translation job to get started.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each $jobStore.jobs as job (job.id)}
				<Card class="flex flex-col">
					<CardHeader>
						<div class="flex justify-between items-start gap-4">
							<div class="flex-1">
								<h2 class="text-lg font-bold">{job.name || 'No name'}</h2>
								<p class="text-gray-500 text-sm">{job.description || 'No description'}</p>
							</div>
							<span class="text-xs font-semibold px-2 py-1 rounded-full {getStatusColor(job.status)}">
								{job.status}
							</span>
						</div>
					</CardHeader>
					<CardContent class="flex-grow space-y-4">
						<div>
							<p class="font-medium text-gray-500 text-sm">Agent & Dataset</p>
							<p class="text-sm">{getAgentName(job.agent_id)}</p>
							<p class="text-sm">{getDatasetName(job.dataset_id)}</p>
						</div>
						{#if job.status === 'running' || job.status === 'completed' || job.status === 'failed'}
							<div>
								<p class="font-medium text-gray-500 text-sm">Progress</p>
								<div class="w-full bg-gray-200 rounded-full h-2.5">
									<div class="bg-blue-600 h-2.5 rounded-full" style="width: {getPercent(job)}%"></div>
								</div>
								<p class="text-xs text-gray-500 mt-1">{job.processed_items} / {job.total_items} items ({getPercent(job)}%)</p>
								{#if job.failed_items > 0}
									<p class="text-xs text-red-500">{job.failed_items} failed</p>
								{/if}
							</div>
							<div class="flex flex-row gap-4 mt-2 text-xs text-gray-600 border border-gray-100 rounded px-2 py-1 bg-gray-50">
								{#if job.started_at && job.completed_at}
									<span>Elapsed: {formatElapsed(job.started_at, job.completed_at)}</span>
								{/if}
								{#if job.total_tokens}
									<span>Tokens: {job.total_tokens}</span>
								{/if}
								{#if job.total_cost}
									<span>Cost: ${job.total_cost.toFixed(4)}</span>
								{/if}
							</div>
						{/if}
						{#if job.error}
							<div>
								<p class="font-medium text-gray-500 text-sm">Error</p>
								<p class="text-xs text-red-500">{job.error}</p>
							</div>
						{/if}
					</CardContent>
					<CardFooter class="flex justify-between items-center">
						<div class="text-sm text-gray-500">
							Created {formatDate(job.created_at)}
						</div>
						<div class="flex gap-2">
							{#if job.status === 'pending' || job.status === 'queued'}
								<Button size="sm" on:click={() => jobStore.startJob(job.id)} disabled={$jobStore.loading}>
									Start
								</Button>
							{/if}
							{#if job.status === 'running'}
								<Button variant="secondary" size="sm" on:click={() => jobStore.cancelJob(job.id)} disabled={$jobStore.loading}>
									Cancel
								</Button>
							{/if}
							{#if job.status === 'completed'}
								<Button variant="secondary" size="sm" on:click={() => viewResults(job.id)}>
									View Results
								</Button>
								<Button variant="secondary" size="sm" on:click={() => downloadResults(job.id)}>
									Download
								</Button>
							{/if}
							{#if job.status === 'failed'}
								<Button variant="secondary" size="sm" on:click={() => retryJob(job.id)}>
									Retry
								</Button>
							{/if}
							<Button variant="danger" size="sm" on:click={() => jobStore.deleteJob(job.id)} disabled={$jobStore.loading}>
								Delete
							</Button>
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Results Modal -->
	{#if showResultsModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={() => showResultsModal = false}>
			<div class="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Translation Results: {selectedJobName}</h2>
					<button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" on:click={() => showResultsModal = false}>×</button>
				</div>
				
				{#if selectedJobResults.length === 0}
					<p class="text-gray-500">No translation results found.</p>
				{:else}
					<!-- Summary Stats -->
					<div class="grid grid-cols-3 gap-4 mb-6">
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-green-600">{selectedJobResults.filter(r => r.status === 'completed').length}</div>
							<div class="text-sm text-green-600">✅ Completed Rows</div>
						</div>
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-red-600">{selectedJobResults.filter(r => r.status === 'failed').length}</div>
							<div class="text-sm text-red-600">❌ Failed Rows</div>
						</div>
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="text-2xl font-bold text-yellow-600">{selectedJobSkippedRows.length}</div>
							<div class="text-sm text-yellow-600">⚠️ Skipped Rows</div>
						</div>
					</div>

					<!-- Completed Results Table -->
					<div class="mb-6">
						<h3 class="text-lg font-medium mb-3">✅ Completed Translations</h3>
						<div class="overflow-x-auto border rounded-lg">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row ID</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Text</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Text</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
										<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each selectedJobResults.filter(r => r.status === 'completed') as result}
										<tr>
											<td class="px-4 py-2 text-sm text-gray-500">{result.row_id || 'N/A'}</td>
											<td class="px-4 py-2 text-sm text-gray-900 max-w-xs">
												<div class="truncate" title={result.source_text}>{result.source_text}</div>
											</td>
											<td class="px-4 py-2 text-sm text-gray-900 max-w-xs">
												<div class="truncate" title={result.target_text}>{result.target_text}</div>
											</td>
											<td class="px-4 py-2 text-sm text-gray-500">{result.source_language} → {result.target_language}</td>
											<td class="px-4 py-2 text-sm text-gray-500">{(result.confidence * 100).toFixed(1)}%</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Skipped Rows Section (Collapsible) -->
					{#if selectedJobSkippedRows.length > 0}
						<div class="mb-6">
							<button 
								class="flex items-center gap-2 text-lg font-medium mb-3 text-yellow-600 hover:text-yellow-700"
								on:click={() => showSkippedRows = !showSkippedRows}
							>
								<span class="transform transition-transform {showSkippedRows ? 'rotate-90' : ''}">▶</span>
								⚠️ Skipped Rows ({selectedJobSkippedRows.length})
							</button>
							
							{#if showSkippedRows}
								<div class="overflow-x-auto border rounded-lg">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-yellow-50">
											<tr>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
												<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
											</tr>
										</thead>
										<tbody class="bg-white divide-y divide-gray-200">
											{#each selectedJobSkippedRows as skipped}
												<tr>
													<td class="px-4 py-2 text-sm text-gray-500">{skipped.row_id || `Row ${skipped.row_number}`}</td>
													<td class="px-4 py-2 text-sm">
														{#if skipped.reason && skipped.reason.includes('timed out after 30 seconds')}
															<span class="inline-flex items-center gap-1 text-yellow-700 font-semibold">
																<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
																Timeout: Agent did not respond in 30s
															</span>
														{:else}
															<span class="inline-flex items-center gap-1 text-red-600 font-semibold">
																<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414" /></svg>
																{skipped.reason}
															</span>
														{/if}
													</td>
													<td class="px-4 py-2 text-sm text-gray-500 max-w-xs">
														<div class="truncate">{JSON.stringify(skipped.data || {})}</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								<div class="mt-2 text-xs text-yellow-700 flex items-center gap-2">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									<span>Timeout means the model/agent did not respond in 30 seconds. Please check that your model endpoint is running and reachable.</span>
								</div>
							{/if}
						</div>
					{/if}
					
					<div class="flex justify-end gap-2">
						<Button variant="secondary" size="sm" on:click={() => showResultsModal = false}>
							Close
						</Button>
						<Button variant="primary" size="sm" on:click={() => downloadResults(selectedJobResults[0]?.job_id)}>
							Download CSV
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main> 