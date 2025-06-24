<script lang="ts">
	import { onMount } from 'svelte';
	import { agentStore } from '../stores/agents';
	import { datasetStore } from '../stores/datasets';
	import { jobStore } from '../stores/jobs';
	import { glossaryStore } from '../stores/glossary';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	onMount(() => {
		// Load all data for the dashboard
		agentStore.loadAgents();
		datasetStore.loadDatasets();
		jobStore.loadJobs();
		glossaryStore.loadGlossary();
	});

	function getStatusCount(jobs: any[], status: string) {
		return jobs.filter(job => job.status === status).length;
	}

	function getRecentJobs(jobs: any[]) {
		return jobs.slice(0, 5);
	}
</script>

<svelte:head>
	<title>Dashboard - Omniglot</title>
	<meta name="description" content="AI-powered translation management dashboard" />
</svelte:head>

<div class="container mx-auto py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold text-gray-900">Welcome to Omniglot</h1>
		<p class="text-gray-600 mt-2">
			AI-powered translation management platform
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<Card>
			<CardHeader>
				<CardTitle>Active Agents</CardTitle>
				<CardDescription>Translation agents currently available</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold">{$agentStore.agents.length}</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Datasets</CardTitle>
				<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{$datasetStore.datasets.length}</div>
				<p class="text-xs text-muted-foreground">
					translation datasets
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Active Jobs</CardTitle>
				<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">
					{getStatusCount($jobStore.jobs, 'running')}
				</div>
				<p class="text-xs text-muted-foreground">
					of {$jobStore.jobs.length} total jobs
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Glossary Terms</CardTitle>
				<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{$glossaryStore.entries.length}</div>
				<p class="text-xs text-muted-foreground">
					translation terms
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<Button asChild class="h-20 flex-col">
			<a href="/agents">
				<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				Manage Agents
			</a>
		</Button>

		<Button asChild class="h-20 flex-col" variant="outline">
			<a href="/datasets">
				<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Upload Datasets
			</a>
		</Button>

		<Button asChild class="h-20 flex-col" variant="outline">
			<a href="/jobs">
				<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				Create Jobs
			</a>
		</Button>

		<Button asChild class="h-20 flex-col" variant="outline">
			<a href="/glossary">
				<svg class="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				Manage Glossary
			</a>
		</Button>
	</div>

	<!-- Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Recent Jobs -->
		<Card>
			<CardHeader>
				<CardTitle>Recent Jobs</CardTitle>
				<CardDescription>Latest translation jobs</CardDescription>
			</CardHeader>
			<CardContent>
				{#if $jobStore.jobs.length === 0}
					<p class="text-gray-500 text-center py-4">No jobs yet</p>
				{:else}
					<div class="space-y-4">
						{#each getRecentJobs($jobStore.jobs) as job}
							<div class="flex items-center justify-between p-3 border rounded-lg">
								<div>
									<p class="font-medium">{job.name}</p>
									<p class="text-sm text-gray-500">
										{job.source_language} → {job.target_language}
									</p>
								</div>
								<div class="text-right">
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {
										job.status === 'completed' ? 'bg-green-100 text-green-800' :
										job.status === 'running' ? 'bg-blue-100 text-blue-800' :
										job.status === 'failed' ? 'bg-red-100 text-red-800' :
										'bg-gray-100 text-gray-800'
									}">
										{job.status.charAt(0).toUpperCase() + job.status.slice(1)}
									</span>
									<p class="text-xs text-gray-500 mt-1">
										{new Date(job.created_at).toLocaleDateString()}
									</p>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-4">
						<Button asChild variant="outline" size="sm">
							<a href="/jobs">View All Jobs</a>
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- System Status -->
		<Card>
			<CardHeader>
				<CardTitle>System Status</CardTitle>
				<CardDescription>Current system health</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Database Connection</span>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
							Connected
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">AI Services</span>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
							Available
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">File Storage</span>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
							Online
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Translation Queue</span>
						<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
							{getStatusCount($jobStore.jobs, 'pending')} pending
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
