<script lang="ts">
import { onMount } from 'svelte';
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
import { supabaseClient } from '$lib/supabaseClient';
import type { PageLoad } from './$types';

let modules: { id: string; name: string; description?: string; created_at?: string }[] = [];
let showAddDialog = false;
let showEditDialog = false;
let showDeleteDialog = false;
let editingModule: any = null;
let deletingModule: any = null;
let newModule = { name: '', description: '' };
let error = '';

async function fetchModules() {
  const { data, error: fetchError } = await supabaseClient.from('modules').select('*').order('name');
  if (fetchError) {
    error = fetchError.message;
    modules = [];
  } else {
    modules = data || [];
  }
}

onMount(fetchModules);

function openAddDialog() {
  newModule = { name: '', description: '' };
  showAddDialog = true;
  error = '';
}

async function handleAdd() {
  error = '';
  if (!newModule.name.trim()) {
    error = 'Module name is required.';
    return;
  }
  const { data, error: insertError } = await supabaseClient.from('modules').insert([{ name: newModule.name, description: newModule.description }]).select().single();
  if (insertError) {
    error = insertError.message;
    return;
  }
  showAddDialog = false;
  await fetchModules();
}

function openEditDialog(module: any) {
  editingModule = { ...module };
  showEditDialog = true;
  error = '';
}

async function handleEdit() {
  error = '';
  if (!editingModule.name.trim()) {
    error = 'Module name is required.';
    return;
  }
  const { data, error: updateError } = await supabaseClient.from('modules').update({ name: editingModule.name, description: editingModule.description }).eq('id', editingModule.id).select();
  if (updateError) {
    error = updateError.message;
    return;
  }
  if (data && data.length === 1) {
    showEditDialog = false;
    await fetchModules();
  } else {
    error = 'Update failed: no row or multiple rows returned.';
  }
}

function openDeleteDialog(module: any) {
  deletingModule = module;
  showDeleteDialog = true;
  error = '';
}

async function handleDelete() {
  error = '';
  const { error: deleteError } = await supabaseClient.from('modules').delete().eq('id', deletingModule.id);
  if (deleteError) {
    error = deleteError.message;
    return;
  }
  showDeleteDialog = false;
  await fetchModules();
}
</script>

<svelte:head>
  <title>Modules - Omniglot</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold">Modules</h1>
      <p class="text-gray-600 mt-1">Manage project/application modules and contexts</p>
    </div>
    <Button on:click={openAddDialog}>Add Module</Button>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
  {/if}

  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Modules</h2>
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
            <th class="relative py-3.5 pl-3 pr-4 sm:pr-6"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if modules.length === 0}
            <tr>
              <td colspan="4" class="py-4 text-center text-sm text-gray-500">No entries found. Add your first entry to get started.</td>
            </tr>
          {:else}
            {#each modules as module (module.id)}
              <tr>
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{module.name}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{module.description}</td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{module.created_at ? new Date(module.created_at).toLocaleString() : ''}</td>
                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Button variant="secondary" size="sm" class="mr-2" on:click={() => openEditDialog(module)}>Edit</Button>
                  <Button variant="danger" size="sm" on:click={() => openDeleteDialog(module)}>Delete</Button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Add Module Modal -->
  <Dialog bind:open={showAddDialog}>
    <DialogContent class="bg-white dark:bg-zinc-950 shadow-lg rounded-lg p-6 w-full max-w-lg mx-auto">
      <DialogHeader>
        <DialogTitle>Add New Module</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <label class="block text-sm font-medium">Module Name</label>
          <Input type="text" bind:value={newModule.name} />
        </div>
        <div>
          <label class="block text-sm font-medium">Description</label>
          <Textarea bind:value={newModule.description} rows={2} />
        </div>
        {#if error}
          <div class="text-red-500 text-xs mb-2">{error}</div>
        {/if}
        <div class="flex gap-2">
          <Button variant="default" on:click={handleAdd}>Save</Button>
          <Button variant="secondary" on:click={() => showAddDialog = false}>Cancel</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Edit Module Modal -->
  <Dialog bind:open={showEditDialog}>
    <DialogContent class="bg-white dark:bg-zinc-950 shadow-lg rounded-lg p-6 w-full max-w-lg mx-auto">
      <DialogHeader>
        <DialogTitle>Edit Module</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <label class="block text-sm font-medium">Module Name</label>
          <Input type="text" bind:value={editingModule.name} />
        </div>
        <div>
          <label class="block text-sm font-medium">Description</label>
          <Textarea bind:value={editingModule.description} rows={2} />
        </div>
        {#if error}
          <div class="text-red-500 text-xs mb-2">{error}</div>
        {/if}
        <div class="flex gap-2">
          <Button variant="default" on:click={handleEdit}>Save</Button>
          <Button variant="secondary" on:click={() => showEditDialog = false}>Cancel</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Modal -->
  <Dialog bind:open={showDeleteDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Module</DialogTitle>
      </DialogHeader>
      <div class="py-4">
        <p>Are you sure you want to delete the module <span class="font-semibold">{deletingModule?.name}</span>?</p>
        {#if error}
          <div class="text-red-500 text-xs mb-2">{error}</div>
        {/if}
        <div class="flex gap-2 mt-4">
          <Button variant="danger" on:click={handleDelete}>Delete</Button>
          <Button variant="secondary" on:click={() => showDeleteDialog = false}>Cancel</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</main> 