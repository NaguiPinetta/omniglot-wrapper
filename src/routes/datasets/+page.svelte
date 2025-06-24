<script lang="ts">
	import { onMount } from 'svelte';
	import { datasetStore } from '../../stores/datasets';
	import { previewFile } from '../../lib/datasets/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import type { DatasetFormData, DatasetPreview } from '../../types/datasets';

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
			return;
		}
		await datasetStore.addDataset(formData);
		if (!$datasetStore.error) {
			resetForm();
			dialogOpen = false;
		}
	}

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
			await datasetStore.deleteDataset(id);
		}
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			formData.file = file;
			formData.name = formData.name || file.name.split('.').slice(0, -1).join('.');
			preview = await previewFile(file);
		}
	}

	function resetForm() {
		formData = { name: '', description: '', file: undefined };
		preview = null;
	}
</script>

<svelte:head>
	<title>Datasets - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-3xl font-bold">Datasets</h1>
		<Dialog bind:open={dialogOpen} onOpenChange={(open) => !open && resetForm()}>
			<DialogTrigger asChild>
				<Button>Upload Dataset</Button>
			</DialogTrigger>
			<DialogContent class="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Upload New Dataset</DialogTitle>
				</DialogHeader>
				<form on:submit|preventDefault={handleUpload} class="space-y-4">
					<div>
						<label for="file-upload" class="block text-sm font-medium mb-1">Dataset File</label>
						<Input
							id="file-upload"
							type="file"
							accept=".csv,.xlsx,.xls,.json"
							on:change={handleFileChange}
							required
						/>
						<p class="text-sm text-gray-500 mt-1">Supported formats: CSV, XLSX, JSON.</p>
					</div>
					<div>
						<label for="dataset-name" class="block text-sm font-medium mb-1">Dataset Name</label>
						<Input
							id="dataset-name"
							type="text"
							placeholder="e.g., 'Product Descriptions Q3'"
							bind:value={formData.name}
							required
						/>
					</div>
					<div>
						<label for="dataset-description" class="block text-sm font-medium mb-1">Description</label>
						<Textarea
							id="dataset-description"
							placeholder="A brief description of the dataset's content."
							bind:value={formData.description}
							rows={3}
						/>
					</div>

					{#if preview}
						<div class="border rounded-lg p-4">
							<h3 class="font-medium mb-2">File Preview</h3>
							<p class="text-sm text-gray-600 mb-2">Total Rows: {preview.totalRows}</p>
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											{#each preview.headers as header}
												<TableHead>{header}</TableHead>
											{/each}
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each preview.rows as row}
											<TableRow>
												{#each preview.headers as header}
													<TableCell>{row[header]}</TableCell>
												{/each}
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						</div>
					{/if}

					{#if $datasetStore.error}
						<p class="text-red-500 text-sm">{$datasetStore.error}</p>
					{/if}

					<div class="flex justify-end gap-2 pt-4">
						<Button variant="outline" type="button" on:click={() => dialogOpen = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={$datasetStore.loading || !formData.file}>
							{$datasetStore.loading ? 'Uploading...' : 'Upload & Create'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	</div>

	{#if $datasetStore.loading && $datasetStore.datasets.length === 0}
		<div class="text-center py-8">
			<p>Loading datasets...</p>
		</div>
	{:else if $datasetStore.datasets.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
				<h3 class="text-xl font-medium">No datasets found</h3>
				<p class="text-gray-500 mt-2">Upload your first dataset to get started.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each $datasetStore.datasets as dataset (dataset.id)}
				<Card class="flex flex-col">
					<CardHeader>
						<div class="flex justify-between items-start gap-4">
							<div class="flex-1">
								<CardTitle>{dataset.name}</CardTitle>
								<CardDescription>{dataset.description || 'No description'}</CardDescription>
							</div>
							<Button
								variant="destructive"
								size="icon"
								on:click={() => handleDelete(dataset.id)}
								disabled={$datasetStore.loading}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
							</Button>
						</div>
					</CardHeader>
					<CardContent class="flex-grow">
						<div class="grid grid-cols-3 gap-4 text-sm">
							<div>
								<p class="font-medium text-gray-500">File Type</p>
								<p>{dataset.file_type.toUpperCase()}</p>
							</div>
							<div>
								<p class="font-medium text-gray-500">Size</p>
								<p>{(dataset.file_size / 1024).toFixed(2)} KB</p>
							</div>
							<div>
								<p class="font-medium text-gray-500">Rows</p>
								<p>{dataset.row_count}</p>
							</div>
						</div>
						<div class="mt-4">
							<p class="font-medium text-gray-500 text-sm">Columns</p>
							<p class="text-sm truncate" title={dataset.columns.join(', ')}>
								{dataset.columns.join(', ')}
							</p>
						</div>
					</CardContent>
					<CardFooter>
						<div class="text-sm text-gray-500">
							Uploaded on {new Date(dataset.created_at).toLocaleDateString()}
						</div>
					</CardFooter>
				</Card>
			{/each}
		</div>
	{/if}
</main>

<style>
	:global(.dialog-content) {
		max-width: 600px !important;
	}
</style> 