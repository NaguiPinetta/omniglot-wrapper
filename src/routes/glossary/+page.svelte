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
	import { getLanguageOptions } from '$lib/utils';

	// New: modules and filter state
	export let data: { entries: GlossaryEntry[]; modules: any[]; error: string | null };
	let modules = data.modules || [];
	let moduleFilter: string = '';

	let showAddDialog = false;
	let isEditing = false;
	let currentEditId: string | null = null;
	let editingEntry: GlossaryFormData = {
		term: '',
		translation: '',
		note: '',
		language: 'es',
		context: '',
		module_id: '',
		type: '',
		description: '',
		exceptions: {}
	};

	let showAddModule = false;
	let newModuleName = '';
	let newModuleDescription = '';
	let addModuleError = '';
	let moduleDropdownOpen = false;

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
		console.log('=== GLOSSARY SAVE DEBUG START ===');
		console.log('Editing entry:', editingEntry);
		console.log('Exceptions input:', exceptionsInput);
		console.log('Is editing:', isEditing);
		console.log('Current edit ID:', currentEditId);
		
		// Clean up the entry data before saving
		const cleanedEntry = {
			...editingEntry,
			// Convert empty strings to undefined for optional fields, except module_id
			note: editingEntry.note?.trim() || undefined,
			context: editingEntry.context?.trim() || undefined,
			// module_id should be empty string (not undefined) to match API schema
			module_id: editingEntry.module_id || '',
			type: editingEntry.type?.trim() || undefined,
			description: editingEntry.description?.trim() || undefined,
			// Ensure exceptions is valid JSON or undefined
			exceptions: editingEntry.exceptions && Object.keys(editingEntry.exceptions).length > 0 
				? editingEntry.exceptions 
				: undefined
		};
		
		console.log('Cleaned entry:', cleanedEntry);
		
		try {
			if (isEditing && currentEditId) {
				console.log('Updating entry...');
				await glossaryStore.updateEntry(currentEditId, cleanedEntry);
			} else {
				console.log('Adding new entry...');
				await glossaryStore.addEntry(cleanedEntry);
			}
			
			console.log('Store error after save:', $glossaryStore.error);
			
			if (!$glossaryStore.error) {
				console.log('Save successful, closing dialog');
				showAddDialog = false;
				isEditing = false;
				currentEditId = null;
			} else {
				console.error('Store error:', $glossaryStore.error);
			}
		} catch (error) {
			console.error('Exception during save:', error);
		}
		
		console.log('=== GLOSSARY SAVE DEBUG END ===');
	}

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this entry?')) {
			await glossaryStore.deleteEntry(id);
		}
	}

	// Helper for exceptions JSON input
	let exceptionsInput = '';
	function syncExceptionsToInput() {
		exceptionsInput = JSON.stringify(editingEntry.exceptions || {}, null, 2);
	}
	function syncInputToExceptions() {
		try {
			if (exceptionsInput.trim()) {
				editingEntry.exceptions = JSON.parse(exceptionsInput);
			} else {
				editingEntry.exceptions = {};
			}
		} catch (error) {
			console.warn('Invalid JSON in exceptions field:', error);
			// Keep the current exceptions object if JSON is invalid
		}
	}

	async function handleAddModule() {
		addModuleError = '';
		if (!newModuleName.trim()) {
			addModuleError = 'Module name is required.';
			return;
		}
		// Call API to add module
		try {
			const res = await fetch('/api/modules', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newModuleName, description: newModuleDescription })
			});
			const data = await res.json();
			if (data.error) {
				addModuleError = data.error;
				return;
			}
			await refreshModules();
			editingEntry.module_id = data.id;
			showAddModule = false;
			newModuleName = '';
			newModuleDescription = '';
		} catch (e) {
			addModuleError = 'Failed to add module.';
		}
	}

	async function refreshModules() {
		console.log('🔄 Refreshing modules...');
		try {
			// Use the API endpoint instead of direct Supabase client
			const response = await fetch('/api/modules');
			console.log('📡 API response status:', response.status, response.statusText);
			
			const result = await response.json();
			console.log('📦 API response data:', result);
			
			if (!response.ok) {
				console.error('❌ Failed to load modules:', result.error || 'Unknown error');
			} else {
				// The API returns the modules array directly, not wrapped in an object
				modules = result || [];
				console.log('✅ Refreshed modules count:', modules.length);
				console.log('📋 Module names:', modules.map(m => m.name));
			}
		} catch (error) {
			console.error('💥 Error refreshing modules:', error);
		}
	}
</script>

<svelte:head>
	<title>Glossary - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold">Glossary Management</h1>
			<p class="text-gray-600 mt-1">Upload and manage key term translations</p>
		</div>
		<Button on:click={() => { editingEntry = { term: '', translation: '', note: '', language: 'es', context: '', module_id: '', type: '', description: '', exceptions: {} }; isEditing = false; currentEditId = null; showAddDialog = true; }}>
			Add Term
		</Button>
	</div>
	<div class="flex gap-4 items-center mb-4">
		<label class="text-sm font-medium">Filter by Module:</label>
		<select bind:value={moduleFilter} class="border rounded px-2 py-1">
			<option value="">All Modules</option>
			{#each modules as mod}
				<option value={mod.id}>{mod.name}</option>
			{/each}
		</select>
	</div>

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
									editingEntry = { term: '', translation: '', note: '', language: 'es', context: '', module_id: '', type: '', description: '', exceptions: {} };
									isEditing = false;
									currentEditId = null;
								}}
								disabled={$glossaryStore.loading}
							>
								Add Entry
							</Button>
						</DialogTrigger>
						<DialogContent class="bg-white dark:bg-zinc-950 shadow-lg rounded-lg p-6 w-full max-w-lg mx-auto">
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
									<label for="translation" class="block text-sm font-medium text-gray-700">Translation</label>
									<Input
										type="text"
										id="translation"
										bind:value={editingEntry.translation}
										disabled={$glossaryStore.loading}
									/>
								</div>
								<div>
									<label for="language" class="block text-sm font-medium text-gray-700">Language</label>
									<select id="language" bind:value={editingEntry.language} class="w-full border rounded px-2 py-1">
										{#each getLanguageOptions() as lang}
											<option value={lang.code}>{lang.name} ({lang.code})</option>
										{/each}
									</select>
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
								<div>
									<label class="block text-sm font-medium">Module</label>
									<select
										bind:value={editingEntry.module_id}
										class="w-full border rounded px-2 py-1"
										on:focus={() => { refreshModules(); moduleDropdownOpen = true; }}
										on:blur={() => { moduleDropdownOpen = false; }}
									>
										<option value="">None</option>
										{#each modules as mod}
											<option value={mod.id}>{mod.name}</option>
										{/each}
									</select>
								</div>
								<div>
									<label class="block text-sm font-medium">Type</label>
									<Input type="text" bind:value={editingEntry.type} />
								</div>
								<div>
									<label class="block text-sm font-medium">Description</label>
									<Input type="text" bind:value={editingEntry.description} />
								</div>
								<div>
									<label class="block text-sm font-medium">Exceptions (JSON)</label>
									<Textarea bind:value={exceptionsInput} rows={3} on:input={syncInputToExceptions} on:blur={syncInputToExceptions} />
									<Button size="sm" variant="secondary" on:click={syncExceptionsToInput}>Sync from object</Button>
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
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Module</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
									<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Exceptions</th>
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
									{#each (moduleFilter ? $glossaryStore.entries.filter(e => e.module_id === moduleFilter) : $glossaryStore.entries) as entry (entry.id)}
										<tr>
											<td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{entry.term}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{entry.translation}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.language || 'es'}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.context || entry.note || '-'}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.module_name}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.type}</td>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.description}</td>
											<td><pre class="text-xs max-w-xs whitespace-pre-wrap">{entry.exceptions ? Object.keys(entry.exceptions).join(', ') : ''}</pre></td>
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
													variant="danger"
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