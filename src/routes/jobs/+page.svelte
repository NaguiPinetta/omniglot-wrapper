<script lang="ts">
	import { onMount } from 'svelte';
	import { jobStore } from '../../stores/jobs';
	import { agentStore } from '../../stores/agents';
	import { datasetStore } from '../../stores/datasets';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { JobFormData, Job } from '../../types/jobs';

	let dialogOpen = false;
	let formData: JobFormData = {
		name: '',
		description: '',
		source_language: 'en',
		target_language: 'es',
		agent_id: '',
		dataset_id: ''
	};

	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'de', name: 'German' },
		{ code: 'it', name: 'Italian' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'ru', name: 'Russian' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' }
	];

	onMount(() => {
		jobStore.loadJobs();
		agentStore.loadAgents();
		datasetStore.loadDatasets();
	});

	async function handleSubmit() {
		await jobStore.addJob(formData);
		if (!$jobStore.error) {
			resetForm();
			dialogOpen = false;
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			source_language: 'en',
			target_language: 'es',
			agent_id: '',
			dataset_id: ''
		};
	}

	function getStatusColor(status: Job['status']) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'running': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'failed': return 'bg-red-100 text-red-800';
			case 'cancelled': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getLanguageName(code: string) {
		return languages.find(l => l.code === code)?.name || code;
	}

	function getAgentName(id: string) {
		return $agentStore.agents.find(a => a.id === id)?.name || 'Unknown Agent';
	}

	function getDatasetName(id: string) {
		return $datasetStore.datasets.find(d => d.id === id)?.name || 'Unknown Dataset';
	}
</script>

<svelte:head>
	<title>Jobs - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-8">
		<div class="flex-1">
			<h1 class="text-3xl font-bold">Translation Jobs</h1>
			<p class="text-gray-600">Monitor and manage translation jobs</p>
		</div>
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				<Button on:click={resetForm}>Create Job</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create New Translation Job</DialogTitle>
				</DialogHeader>
				<form on:submit|preventDefault={handleSubmit} class="space-y-4 pt-4">
					<div>
						<label for="job-name" class="block text-sm font-medium mb-1">Job Name</label>
						<Input
							id="job-name"
							type="text"
							placeholder="e.g., 'Translate Italian Marketing Copy'"
							bind:value={formData.name}
							required
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
							<label for="source-lang" class="block text-sm font-medium mb-1">Source Language</label>
							<select
								id="source-lang"
								bind:value={formData.source_language}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								{#each languages as lang}
									<option value={lang.code}>{lang.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="target-lang" class="block text-sm font-medium mb-1">Target Language</label>
							<select
								id="target-lang"
								bind:value={formData.target_language}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								{#each languages as lang}
									<option value={lang.code}>{lang.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="agent" class="block text-sm font-medium mb-1">Agent</label>
							<select
								id="agent"
								bind:value={formData.agent_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select an agent</option>
								{#each $agentStore.agents as agent}
									<option value={agent.id}>{agent.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="dataset" class="block text-sm font-medium mb-1">Dataset</label>
							<select
								id="dataset"
								bind:value={formData.dataset_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="" disabled>Select a dataset</option>
								{#each $datasetStore.datasets as dataset}
									<option value={dataset.id}>{dataset.name}</option>
								{/each}
							</select>
						</div>
					</div>

					{#if $jobStore.error}
						<p class="text-red-500 text-sm">Error: {$jobStore.error}</p>
					{/if}

					<div class="flex justify-end gap-2 pt-4">
						<Button variant="outline" type="button" on:click={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={$jobStore.loading}>
							{$jobStore.loading ? 'Creating...' : 'Create Job'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if $jobStore.loading && $jobStore.jobs.length === 0}
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
								<CardTitle>{job.name}</CardTitle>
								<CardDescription>{job.description || 'No description'}</CardDescription>
							</div>
							<span class="text-xs font-semibold px-2 py-1 rounded-full {getStatusColor(job.status)}">
								{job.status}
							</span>
						</div>
					</CardHeader>
					<CardContent class="flex-grow space-y-4">
						<div>
							<p class="font-medium text-gray-500 text-sm">Translation</p>
							<p>{getLanguageName(job.source_language)} → {getLanguageName(job.target_language)}</p>
						</div>
						<div>
							<p class="font-medium text-gray-500 text-sm">Agent & Dataset</p>
							<p>{getAgentName(job.agent_id)} / {getDatasetName(job.dataset_id)}</p>
						</div>
						{#if job.status === 'running' || job.status === 'completed' || job.status === 'failed'}
							<div>
								<p class="font-medium text-gray-500 text-sm">Progress</p>
								<div class="w-full bg-gray-200 rounded-full h-2.5">
									<div class="bg-blue-600 h-2.5 rounded-full" style="width: {job.progress}%"></div>
								</div>
								<p class="text-xs text-gray-500 mt-1">{job.processed_items} / {job.total_items} items ({job.progress}%)</p>
							</div>
						{/if}
					</CardContent>
					<CardFooter class="flex justify-between items-center">
						<div class="text-sm text-gray-500">
							Created on {new Date(job.created_at).toLocaleDateString()}
						</div>
						<div class="flex gap-2">
							{#if job.status === 'pending'}
								<Button size="sm" on:click={() => jobStore.startJob(job.id)} disabled={$jobStore.loading}>Start</Button>
							{/if}
							{#if job.status === 'running'}
								<Button variant="outline" size="sm" on:click={() => jobStore.cancelJob(job.id)} disabled={$jobStore.loading}>Cancel</Button>
							{/if}
							<Button variant="destructive" size="sm" on:click={() => jobStore.deleteJob(job.id)} disabled={$jobStore.loading}>Delete</Button>
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}
</main> 