<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/ui/Button.svelte';
	import { addGlossaryEntry, updateGlossaryEntry, deleteGlossaryEntry } from '$lib/glossary/api';
	import type { GlossaryEntry, GlossaryFormData } from '../../types/glossary';

	export let data: { entries: GlossaryEntry[]; error: string | null };

	let entries = data.entries;
	let loading = false;
	let error = data.error;
	let showAddDialog = false;

	// Form state for new/edit entry
	let editingEntry: GlossaryFormData = {
		term: '',
		translation: '',
		note: '',
		language: 'es',
		context: ''
	};
	let isEditing = false;
	let currentEditId: string | null = null;

	async function handleSave() {
		loading = true;
		try {
			if (isEditing && currentEditId) {
				await updateGlossaryEntry(currentEditId, editingEntry);
				entries = entries.map(entry => 
					entry.id === currentEditId 
						? { ...entry, term: editingEntry.term, translation: editingEntry.translation, note: editingEntry.note }
						: entry
				);
			} else {
				const newEntry = await addGlossaryEntry(editingEntry);
				entries = [...entries, newEntry];
			}

			// Reset form
			editingEntry = { term: '', translation: '', note: '', language: 'es', context: '' };
			isEditing = false;
			currentEditId = null;
			showAddDialog = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save entry';
		} finally {
			loading = false;
		}
	}

	function handleEdit(entry: GlossaryEntry) {
		editingEntry = {
			term: entry.term,
			translation: entry.translation,
			note: entry.note || '',
			language: entry.language || 'es',
			context: entry.context || ''
		};
		currentEditId = entry.id;
		isEditing = true;
		showAddDialog = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this entry?')) return;

		loading = true;
		try {
			await deleteGlossaryEntry(id);
			entries = entries.filter(e => e.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete entry';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Glossary - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-6">Glossary Management</h1>
	<p class="text-gray-600 mb-8">Upload and manage key term translations</p>

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
			{error}
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
					<Button
						variant="primary"
						on:click={() => {
							editingEntry = { term: '', translation: '', note: '', language: 'es', context: '' };
							isEditing = false;
							currentEditId = null;
							showAddDialog = true;
						}}
						disabled={loading}
					>
						Add Entry
					</Button>
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
								{#if loading && entries.length === 0}
									<tr>
										<td colspan="5" class="py-4 text-center text-sm text-gray-500">
											Loading entries...
										</td>
									</tr>
								{:else if entries.length === 0}
									<tr>
										<td colspan="5" class="py-4 text-center text-sm text-gray-500">
											No entries found. Add your first entry to get started.
										</td>
									</tr>
								{:else}
									{#each entries as entry}
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
													disabled={loading}
												>
													Edit
												</Button>
												<Button
													variant="danger"
													size="sm"
													on:click={() => handleDelete(entry.id)}
													disabled={loading}
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

{#if showAddDialog}
	<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
	<div class="fixed inset-0 z-10 overflow-y-auto">
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
				<div>
					<h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
						{isEditing ? 'Edit Entry' : 'Add New Entry'}
					</h3>
					<div class="space-y-4">
						<div>
							<label for="term" class="block text-sm font-medium text-gray-700">Source Term</label>
							<input
								type="text"
								id="term"
								bind:value={editingEntry.term}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								disabled={loading}
							/>
						</div>
						<div>
							<label for="translation" class="block text-sm font-medium text-gray-700">Translation</label>
							<input
								type="text"
								id="translation"
								bind:value={editingEntry.translation}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								disabled={loading}
							/>
						</div>
						<div>
							<label for="context" class="block text-sm font-medium text-gray-700">Context</label>
							<input
								type="text"
								id="context"
								bind:value={editingEntry.context}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								disabled={loading}
							/>
						</div>
						<div>
							<label for="note" class="block text-sm font-medium text-gray-700">Additional Notes</label>
							<input
								type="text"
								id="note"
								bind:value={editingEntry.note}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								disabled={loading}
							/>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
					<Button
						variant="primary"
						on:click={handleSave}
						disabled={loading || !editingEntry.term || !editingEntry.translation}
					>
						{#if loading}
							Saving...
						{:else}
							{isEditing ? 'Save Changes' : 'Add Entry'}
						{/if}
					</Button>
					<Button
						variant="secondary"
						on:click={() => {
							showAddDialog = false;
							editingEntry = { term: '', translation: '', note: '', language: 'es', context: '' };
							isEditing = false;
							currentEditId = null;
						}}
						disabled={loading}
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if} 