<script lang="ts">
  import { onMount } from 'svelte';
  import { agentStore } from '../../stores/agents';
  import { createAgent, updateAgent, deleteAgent, toggleAgentStatus } from '../../lib/agents/api';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import type { AgentFormData, Agent } from '../../types/agents';

  let loading = false;
  let error: string | null = null;
  let editingAgent: Agent | null = null;
  let dialogOpen = false;
  let formData: AgentFormData = {
    name: '',
    description: '',
    type: 'translator',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: '',
    user_prompt_template: ''
  };

  const agentTypes = [
    { value: 'translator', label: 'Translator' },
    { value: 'reviewer', label: 'Reviewer' },
    { value: 'custom', label: 'Custom' }
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ];

  onMount(() => {
    agentStore.loadAgents();
  });

  async function handleSubmit() {
    loading = true;
    error = null;

    try {
      if (editingAgent) {
        const updatedAgent = await updateAgent(editingAgent.id, formData);
        agentStore.updateAgent(updatedAgent);
      } else {
        const newAgent = await createAgent(formData);
        agentStore.addAgent(newAgent);
      }
      resetForm();
      dialogOpen = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save agent';
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAgent(id);
      agentStore.removeAgent(id);
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  }

  async function handleToggleStatus(id: string, isActive: boolean) {
    try {
      const updatedAgent = await toggleAgentStatus(id, isActive);
      agentStore.updateAgent(updatedAgent);
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  }

  function editAgent(agent: Agent) {
    editingAgent = agent;
    formData = {
      name: agent.name,
      description: agent.description,
      type: agent.type,
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      system_prompt: agent.system_prompt,
      user_prompt_template: agent.user_prompt_template
    };
    dialogOpen = true;
  }

  function resetForm() {
    editingAgent = null;
    formData = {
      name: '',
      description: '',
      type: 'translator',
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000,
      system_prompt: '',
      user_prompt_template: ''
    };
    error = null;
  }
</script>

<svelte:head>
  <title>AI Agents - Omniglot</title>
  <meta name="description" content="Configure and manage AI translation agents" />
</svelte:head>

<main class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Translation Agents</h1>
          <p class="text-gray-600 mt-2">
            Configure and manage your AI translation agents
          </p>
        </div>
        <Dialog bind:open={dialogOpen}>
          <DialogTrigger asChild>
            <Button on:click={resetForm}>Create Agent</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
            </DialogHeader>
            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Name</label>
                  <Input
                    type="text"
                    placeholder="Agent Name"
                    bind:value={formData.name}
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Type</label>
                  <select
                    bind:value={formData.type}
                    class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {#each agentTypes as type}
                      <option value={type.value}>{type.label}</option>
                    {/each}
                  </select>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  placeholder="Agent description"
                  bind:value={formData.description}
                  rows={2}
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Model</label>
                  <select
                    bind:value={formData.model}
                    class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {#each models as model}
                      <option value={model.value}>{model.label}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Temperature</label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    bind:value={formData.temperature}
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Max Tokens</label>
                <Input
                  type="number"
                  min="1"
                  bind:value={formData.max_tokens}
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">System Prompt</label>
                <Textarea
                  placeholder="System prompt for the agent"
                  bind:value={formData.system_prompt}
                  rows={3}
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">User Prompt Template</label>
                <Textarea
                  placeholder="Template for user prompts (use {input} for placeholder)"
                  bind:value={formData.user_prompt_template}
                  rows={3}
                />
              </div>

              {#if error}
                <p class="text-red-500 text-sm">{error}</p>
              {/if}

              <div class="flex justify-end gap-2">
                <Button variant="outline" on:click={() => dialogOpen = false}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingAgent ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <!-- Loading State -->
    {#if error}
      <div class="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        {error}
      </div>
    {:else if loading}
      <div class="text-center py-4">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Loading agents...</p>
      </div>
    {:else if $agentStore.agents.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No agents configured</h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by creating your first AI translation agent.
        </p>
        <div class="mt-6">
          <Button
            on:click={resetForm}
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Agent
          </Button>
        </div>
      </div>
    {:else}
      <!-- Agents Grid -->
      <div class="mt-8 grid gap-6">
        {#each $agentStore.agents as agent (agent.id)}
          <Card>
            <CardHeader>
              <div class="flex justify-between items-start">
                <div>
                  <CardTitle class="flex items-center gap-2">
                    {agent.name}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {agent.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => handleToggleStatus(agent.id, !agent.is_active)}
                  >
                    {agent.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    on:click={() => editAgent(agent)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    on:click={() => handleDelete(agent.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="font-medium">Type</p>
                  <p class="text-gray-600 capitalize">{agent.type}</p>
                </div>
                <div>
                  <p class="font-medium">Model</p>
                  <p class="text-gray-600">{agent.model}</p>
                </div>
                <div>
                  <p class="font-medium">Temperature</p>
                  <p class="text-gray-600">{agent.temperature}</p>
                </div>
                <div>
                  <p class="font-medium">Max Tokens</p>
                  <p class="text-gray-600">{agent.max_tokens}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div class="text-sm text-gray-500">
                Created {new Date(agent.created_at).toLocaleDateString()}
              </div>
            </CardFooter>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</main>

<style>
  /* Additional styles can be added here if needed */
</style> 