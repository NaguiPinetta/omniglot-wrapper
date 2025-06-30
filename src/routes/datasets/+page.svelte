<script lang="ts">
	import { onMount } from 'svelte';
	import { datasetStore } from '../../stores/datasets';
	import { previewFile } from '../../lib/datasets/api';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import type { DatasetFormData, DatasetPreview } from '../../types/datasets';
	import type { PageData } from './$types';

	export let data: PageData;

	let formData: DatasetFormData = {
		name: '',
		description: '',
		file: undefined
	};
	let preview: DatasetPreview | null = null;
	let showModal = false;

	// Initialize store with server data
	onMount(() => {
		if (data.datasets) {
			datasetStore.set({ datasets: data.datasets, loading: false, error: data.error || null });
		}
	});

	async function handleUpload() {
		console.log('=== DATASET UI DEBUG START ===');
		console.log('handleUpload called');
		console.log('FormData:', { 
			name: formData.name, 
			description: formData.description, 
			hasFile: !!formData.file,
			fileName: formData.file?.name 
		});
		
		if (!formData.file) {
			console.log('No file provided, returning early');
			return;
		}
		
		try {
			console.log('Calling datasetStore.addDataset...');
			await datasetStore.addDataset(formData);
			console.log('Dataset store call completed');
			console.log('Dataset store error:', $datasetStore.error);
			
			if (!$datasetStore.error) {
				console.log('Upload successful, resetting form and closing modal');
				resetForm();
				showModal = false;
				console.log('=== DATASET UI DEBUG END (SUCCESS) ===');
			} else {
				console.log('Upload failed with store error:', $datasetStore.error);
				console.log('=== DATASET UI DEBUG END (STORE ERROR) ===');
			}
		} catch (error) {
			console.error('=== DATASET UI DEBUG END (EXCEPTION) ===');
			console.error('Upload error caught in UI:', error);
			console.error('Error type:', typeof error);
			console.error('Error message:', error instanceof Error ? error.message : String(error));
			console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		}
	}

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
			await datasetStore.deleteDataset(id);
		}
	}

	async function handleFileChange(event: Event) {
		console.log('handleFileChange called', event);
		const input = event.target as HTMLInputElement;
		console.log('input.files:', input.files);
		if (input.files && input.files[0]) {
			const file = input.files[0];
			console.log('File selected:', file.name, file.size);
			formData.file = file;
			formData.name = formData.name || file.name.split('.').slice(0, -1).join('.');
			formData = formData; // Trigger reactivity
			console.log('formData updated:', formData);
			try {
				preview = await previewFile(file);
				console.log('Preview generated:', preview);
			} catch (error) {
				console.error('Error previewing file:', error);
				preview = null;
			}
		} else {
			console.log('No file selected');
		}
	}

	function resetForm() {
		formData = { name: '', description: '', file: undefined };
		preview = null;
	}

	function openModal() {
		resetForm();
		showModal = true;
	}
</script>

<svelte:head>
	<title>Datasets - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold">Datasets</h1>
			<p class="text-gray-600 mt-1">Upload and manage your translation datasets</p>
		</div>
		<Button on:click={openModal}>Upload Dataset</Button>
	</div>

	<!-- Upload Modal -->
	{#if showModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click={() => showModal = false}>
			<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Upload New Dataset</h2>
					<button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" on:click={() => showModal = false}>×</button>
				</div>
				<form on:submit|preventDefault={handleUpload} class="space-y-4">
					<div>
						<label for="file-upload" class="block text-sm font-medium mb-1">Dataset File</label>
						<input
							id="file-upload"
							type="file"
							accept=".csv,.xlsx,.xls,.json,.xml"
							on:change={handleFileChange}
							required
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<p class="text-sm text-gray-500 mt-1">Supported formats: CSV, XLSX, JSON, XML.</p>
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

					<!-- Debug Info -->
					<div class="text-xs text-gray-500 p-2 bg-gray-50 rounded">
						Debug: loading={$datasetStore.loading}, hasFile={!!formData.file}, fileName={formData.file?.name}
					</div>

					<div class="flex justify-end gap-2 pt-4">
						<Button type="button" on:click={() => showModal = false}>
							Cancel
						</Button>
						<Button type="submit" disabled={$datasetStore.loading || !formData.file}>
							{$datasetStore.loading ? 'Uploading...' : 'Upload & Create'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if data.error}
		<Card class="border-red-200 bg-red-50 mb-6">
			<CardContent class="py-4">
				<p class="text-red-600">Error loading data: {data.error}</p>
			</CardContent>
		</Card>
	{/if}

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
								size="sm"
								on:click={() => handleDelete(dataset.id)}
								disabled={$datasetStore.loading}
							>
								Delete
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