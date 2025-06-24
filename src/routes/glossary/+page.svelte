<script lang="ts">
	import { onMount } from 'svelte';
	import { glossaryStore } from '../../stores/glossary';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import type { GlossaryFormData, GlossaryEntry } from '../../types/glossary';

	let showAddDialog = false;
	let isEditing = false;
	let currentEditId: string | null = null;
	let editingEntry: GlossaryFormData = {
		term: '',
		translation: '',
		note: '',
		language: 'es',
		context: ''
	};

	onMount(() => {
		glossaryStore.loadEntries();
	});

	function handleEdit(entry: GlossaryEntry) {
		editingEntry = { ...entry };
		isEditing = true;
		currentEditId = entry.id;
		showAddDialog = true;
	}

	async function handleSave() {
		if (isEditing && currentEditId) {
			await glossaryStore.updateEntry(currentEditId, editingEntry);
		} else {
			await glossaryStore.addEntry(editingEntry);
		}
		if (!$glossaryStore.error) {
			showAddDialog = false;
			isEditing = false;
			currentEditId = null;
		}
	}

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this entry?')) {
			await glossaryStore.deleteEntry(id);
		}
	}
</script>

<svelte:head>
	<title>Glossary - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-6">Glossary Management</h1>
	<p class="text-gray-600 mb-8">Upload and manage key term translations</p>

	{#if $glossaryStore.error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
			{$glossaryStore.error}
		</div>
	{/if}

	<div class="bg-white shadow rounded-lg">
		<div class="px-4 py-5 sm:p-6">
			<div class="sm:flex sm:items-center">
				<div class="sm:flex-auto">
					<h2 class="text-xl font-semibold text-gray-900">Translation Glossary</h2>
					<p class="mt-2 text-sm text-gray-700">
						Manage custom translations and terminology
					</p>
				</div>
				<div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
					<Dialog bind:open={showAddDialog}>
						<DialogTrigger asChild>
							<Button
								variant="default"
								on:click={() => {
									editingEntry = { term: '', translation: '', note: '', language: 'es', context: '' };
									isEditing = false;
									currentEditId = null;
								}}
								disabled={$glossaryStore.loading}
							>
								Add Entry
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{isEditing ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
							</DialogHeader>
							<div class="space-y-4 py-4">
								<div>
									<label for="term" class="block text-sm font-medium text-gray-700">Source Term</label>
									<Input
										type="text"
										id="term"
										bind:value={editingEntry.term}
										disabled={$glossaryStore.loading}
									/>
								</div>
								<div>
									<label for="translation" class="block text-sm font-medium text-gray-700"
										>Translation</label
									>
									<Input
										type="text"
										id="translation"
										bind:value={editingEntry.translation}
										disabled={$glossaryStore.loading}
									/>
								</div>
								<div>
									<label for="context" class="block text-sm font-medium text-gray-700">Context</label>
									<Input
										type="text"
										id="context"
										bind:value={editingEntry.context}
										disabled={$glossaryStore.loading}
									/>
								</div>
								<div>
									<label for="note" class="block text-sm font-medium text-gray-700"
										>Additional Notes</label
									>
									<Textarea
										id="note"
										bind:value={editingEntry.note}
										disabled={$glossaryStore.loading}
									/>
								</div>
							</div>
							<div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
								<Button
									variant="default"
									on:click={handleSave}
									disabled={$glossaryStore.loading || !editingEntry.term || !editingEntry.translation}
								>
									{#if $glossaryStore.loading}
										Saving...
									{:else}
										{isEditing ? 'Save Changes' : 'Add Entry'}
									{/if}
								</Button>
								<Button
									variant="secondary"
									on:click={() => {
										showAddDialog = false;
									}}
									disabled={$glossaryStore.loading}
								>
									Cancel
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div class="mt-8 flow-root">
				<div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
					<div class="inline-block min-w-full py-2 align-middle">
						<table class="min-w-full divide-y divide-gray-300">
							<thead>
								<tr>
									<th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Source</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Language</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Context</th>
									<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
										<span class="sr-only">Actions</span>
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#if $glossaryStore.loading && $glossaryStore.entries.length === 0}
									<tr>
										<td colspan="5" class="py-4 text-center text-sm text-gray-500">
											Loading entries...
										</td>
									</tr>
								{:else if $glossaryStore.entries.length === 0}
									<tr>
										<td colspan="5" class="py-4 text-center text-sm text-gray-500">
											No entries found. Add your first entry to get started.
										</td>
									</tr>
								{:else}
									{#each $glossaryStore.entries as entry (entry.id)}
										<tr>
											<td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{entry.term}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{entry.translation}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.language || 'es'}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.context || entry.note || '-'}</td>
											<td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
												<Button
													variant="secondary"
													size="sm"
													class="mr-2"
													on:click={() => handleEdit(entry)}
													disabled={$glossaryStore.loading}
												>
													Edit
												</Button>
												<Button
													variant="destructive"
													size="sm"
													on:click={() => handleDelete(entry.id)}
													disabled={$glossaryStore.loading}
												>
													Delete
												</Button>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
</main> 