<script lang="ts">
	import { onMount } from 'svelte';
	import { jobStore } from '../../stores/jobs';
	import { agentStore } from '../../stores/agents';
	import { datasetStore } from '../../stores/datasets';
	import { createJob, startJob, cancelJob, deleteJob } from '../../lib/jobs/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { JobFormData, Job } from '../../types/jobs';

	let loading = false;
	let error: string | null = null;
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
		loading = true;
		error = null;

		try {
			const newJob = await createJob(formData);
			jobStore.addJob(newJob);
			resetForm();
			dialogOpen = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create job';
		} finally {
			loading = false;
		}
	}

	async function handleStartJob(id: string) {
		try {
			const updatedJob = await startJob(id);
			jobStore.updateJob(updatedJob);
		} catch (err) {
			console.error('Failed to start job:', err);
		}
	}

	async function handleCancelJob(id: string) {
		try {
			const updatedJob = await cancelJob(id);
			jobStore.updateJob(updatedJob);
		} catch (err) {
			console.error('Failed to cancel job:', err);
		}
	}

	async function handleDeleteJob(id: string) {
		try {
			await deleteJob(id);
			jobStore.removeJob(id);
		} catch (err) {
			console.error('Failed to delete job:', err);
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
		error = null;
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
	<h1 class="text-3xl font-bold mb-6">Job Manager</h1>
	<p class="text-gray-600">Monitor and manage translation jobs</p>
</main>

<div class="container mx-auto py-8">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold">Translation Jobs</h1>
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				<Button on:click={resetForm}>Create Job</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create Translation Job</DialogTitle>
				</DialogHeader>
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-1">Job Name</label>
						<Input
							type="text"
							placeholder="Job Name"
							bind:value={formData.name}
							required
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-1">Description</label>
						<Textarea
							placeholder="Job description"
							bind:value={formData.description}
							rows={2}
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Source Language</label>
							<select
								bind:value={formData.source_language}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								{#each languages as lang}
									<option value={lang.code}>{lang.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Target Language</label>
							<select
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
							<label class="block text-sm font-medium mb-1">Agent</label>
							<select
								bind:value={formData.agent_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="">Select an agent</option>
								{#each $agentStore.agents as agent}
									<option value={agent.id}>{agent.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Dataset</label>
							<select
								bind:value={formData.dataset_id}
								class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							>
								<option value="">Select a dataset</option>
								{#each $datasetStore.datasets as dataset}
									<option value={dataset.id}>{dataset.name}</option>
								{/each}
							</select>
						</div>
					</div>

					{#if error}
						<p class="text-red-500 text-sm">{error}</p>
					{/if}

					<div class="flex justify-end gap-2">
						<Button variant="outline" on:click={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Creating...' : 'Create Job'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if $jobStore.loading}
		<div class="flex justify-center">
			<p>Loading jobs...</p>
		</div>
	{:else if $jobStore.error}
		<div class="text-red-500">
			<p>Error: {$jobStore.error}</p>
		</div>
	{:else if $jobStore.jobs.length === 0}
		<Card>
			<CardContent class="py-8">
				<p class="text-center text-gray-500">No jobs created yet.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6">
			{#each $jobStore.jobs as job (job.id)}
				<Card>
					<CardHeader>
						<div class="flex justify-between items-start">
							<div>
								<CardTitle class="flex items-center gap-2">
									{job.name}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(job.status)}">
										{job.status.charAt(0).toUpperCase() + job.status.slice(1)}
									</span>
								</CardTitle>
								<CardDescription>{job.description}</CardDescription>
							</div>
							<div class="flex gap-2">
								{#if job.status === 'pending'}
									<Button
										size="sm"
										on:click={() => handleStartJob(job.id)}
									>
										Start
									</Button>
								{:else if job.status === 'running'}
									<Button
										variant="outline"
										size="sm"
										on:click={() => handleCancelJob(job.id)}
									>
										Cancel
									</Button>
								{/if}
								<Button
									variant="destructive"
									size="sm"
									on:click={() => handleDeleteJob(job.id)}
								>
									Delete
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 gap-4 text-sm mb-4">
							<div>
								<p class="font-medium">Translation</p>
								<p class="text-gray-600">{getLanguageName(job.source_language)} → {getLanguageName(job.target_language)}</p>
							</div>
							<div>
								<p class="font-medium">Agent</p>
								<p class="text-gray-600">{getAgentName(job.agent_id)}</p>
							</div>
							<div>
								<p class="font-medium">Dataset</p>
								<p class="text-gray-600">{getDatasetName(job.dataset_id)}</p>
							</div>
							<div>
								<p class="font-medium">Progress</p>
								<p class="text-gray-600">{job.processed_items}/{job.total_items} ({job.progress}%)</p>
							</div>
						</div>
						
						{#if job.status === 'running' || job.status === 'completed'}
							<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
								<div class="bg-blue-600 h-2 rounded-full" style="width: {job.progress}%"></div>
							</div>
							<div class="text-xs text-gray-500">
								{job.processed_items} processed, {job.failed_items} failed
							</div>
						{/if}

						{#if job.error_message}
							<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
								Error: {job.error_message}
							</div>
						{/if}
					</CardContent>
					<CardFooter>
						<div class="text-sm text-gray-500">
							Created {new Date(job.created_at).toLocaleDateString()}
							{#if job.started_at}
								• Started {new Date(job.started_at).toLocaleDateString()}
							{/if}
							{#if job.completed_at}
								• Completed {new Date(job.completed_at).toLocaleDateString()}
							{/if}
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}
</div> 