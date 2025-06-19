<script lang="ts">
	import { onMount } from 'svelte';
	import { datasetStore } from '../../stores/datasets';
	import { uploadDataset, deleteDataset } from '../../lib/datasets/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import type { DatasetFormData, DatasetPreview } from '../../types/datasets';

	let uploading = false;
	let uploadError: string | null = null;
	let formData: DatasetFormData = {
		name: '',
		description: '',
		file: undefined
	};
	let preview: DatasetPreview | null = null;
	let dialogOpen = false;

	onMount(() => {
		datasetStore.loadDatasets();
	});

	async function handleUpload() {
		if (!formData.file) {
			uploadError = 'Please select a file';
			return;
		}

		uploading = true;
		uploadError = null;

		try {
			const response = await uploadDataset(formData);
			datasetStore.addDataset(response.dataset);
			preview = response.preview;
			resetForm();
			dialogOpen = false;
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'Failed to upload dataset';
		} finally {
			uploading = false;
		}
	}

	async function handleDelete(id: string) {
		try {
			await deleteDataset(id);
			datasetStore.removeDataset(id);
		} catch (error) {
			console.error('Failed to delete dataset:', error);
		}
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			formData.file = input.files[0];
			formData.name = formData.name || input.files[0].name.split('.')[0];
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			file: undefined
		};
		preview = null;
		uploadError = null;
	}
</script>

<svelte:head>
	<title>Datasets - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-6">Datasets</h1>
	<p class="text-gray-600">Upload and manage source files for translation</p>
</main>

<div class="container mx-auto py-8">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold">Datasets</h1>
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger asChild>
				<Button>Upload Dataset</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Upload Dataset</DialogTitle>
				</DialogHeader>
				<form on:submit|preventDefault={handleUpload} class="space-y-4">
					<div>
						<Input
							type="file"
							accept=".csv,.xlsx,.xls,.json"
							on:change={handleFileChange}
							required
						/>
					</div>
					<div>
						<Input
							type="text"
							placeholder="Dataset Name"
							bind:value={formData.name}
							required
						/>
					</div>
					<div>
						<Textarea
							placeholder="Description"
							bind:value={formData.description}
							rows={3}
						/>
					</div>
					{#if uploadError}
						<p class="text-red-500 text-sm">{uploadError}</p>
					{/if}
					<div class="flex justify-end gap-2">
						<Button variant="outline" on:click={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={uploading}>
							{uploading ? 'Uploading...' : 'Upload'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if $datasetStore.loading}
		<div class="flex justify-center">
			<p>Loading datasets...</p>
		</div>
	{:else if $datasetStore.error}
		<div class="text-red-500">
			<p>Error: {$datasetStore.error}</p>
		</div>
	{:else if $datasetStore.datasets.length === 0}
		<Card>
			<CardContent class="py-8">
				<p class="text-center text-gray-500">No datasets uploaded yet.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6">
			{#each $datasetStore.datasets as dataset (dataset.id)}
				<Card>
					<CardHeader>
						<div class="flex justify-between items-start">
							<div>
								<CardTitle>{dataset.name}</CardTitle>
								<CardDescription>{dataset.description}</CardDescription>
							</div>
							<Button
								variant="destructive"
								size="sm"
								on:click={() => handleDelete(dataset.id)}
							>
								Delete
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-3 gap-4 text-sm mb-4">
							<div>
								<p class="font-medium">File Type</p>
								<p class="text-gray-600">{dataset.file_type.toUpperCase()}</p>
							</div>
							<div>
								<p class="font-medium">Size</p>
								<p class="text-gray-600">{(dataset.file_size / 1024).toFixed(2)} KB</p>
							</div>
							<div>
								<p class="font-medium">Rows</p>
								<p class="text-gray-600">{dataset.row_count}</p>
							</div>
						</div>
						<div class="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										{#each dataset.columns as column}
											<TableHead>{column}</TableHead>
										{/each}
									</TableRow>
								</TableHeader>
							</Table>
						</div>
					</CardContent>
					<CardFooter>
						<div class="text-sm text-gray-500">
							Uploaded {new Date(dataset.created_at).toLocaleDateString()}
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(.dialog-content) {
		max-width: 600px !important;
	}
</style> 