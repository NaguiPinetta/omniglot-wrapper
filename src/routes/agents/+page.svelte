<script lang="ts">
  import { onMount } from 'svelte';
  import { agentStore } from '../../stores/agents';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import type { AgentFormData, Agent } from '../../types/agents';
  import type { PageData } from './$types';
  import { modelStore } from '../../stores/models';
  import type { Model } from '../../types/models';
  import { logger } from '$lib/utils/logger';

  export let data: PageData;

  let editingAgent: Agent | null = null;
  let dialogOpen = false;
  let formData: AgentFormData = {
    custom_name: '',
    prompt: 'You are a helpful assistant that translates text.',
    model_id: '',
    model_provider: 'openai',
    temperature: 0.7,
    top_p: 1.0
  };

  const modelProviders = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'custom', label: 'Custom' }
  ];

  // Provider-key dropdown options
  $: providerKeyOptions = $modelStore.apiKeys.map(k => ({
    provider: k.provider,
    keyId: k.id,
    name: k.name,
    label: `${k.provider.charAt(0).toUpperCase() + k.provider.slice(1)} – ${k.name}`
  }));

  // Store selected provider-key id
  let selectedProviderKeyId = '';

  // Find the selected provider-key object
  $: selectedProviderKey = providerKeyOptions.find(opt => opt.keyId === selectedProviderKeyId) || null;

  // Filter models by selected provider and key
  $: filteredModels = selectedProviderKey
    ? $modelStore.models.filter(m => m.provider === selectedProviderKey.provider && m.api_key_id === selectedProviderKey.keyId)
    : [];

  let availableModels: Model[] = [];
  let loadingModels = false;

  onMount(() => {
    // Initialize store with server-loaded data
    const agentLogger = logger.scope('AgentMount');
    agentLogger.debug('Initializing agents page', { 
      hasAgents: !!data.agents, 
      agentCount: data.agents?.length,
      hasApiKeys: !!data.apiKeys,
      hasModels: !!data.models,
      hasError: !!data.error
    });
    
    if (data.agents) {
      agentStore.setAgents(data.agents);
    }
    if (data.apiKeys) {
      modelStore.setApiKeys(data.apiKeys);
    }
    if (data.models) {
      modelStore.setModels(data.models);
    }
    if (data.error) {
      agentStore.setError(data.error);
    }
  });

  // Reactive statement to keep formData in sync with agent store changes
  $: if ($agentStore.agents.length > 0 && !editingAgent) {
    // Reset formData when agents are updated and we're not editing
    formData = {
      custom_name: '',
      prompt: 'You are a helpful assistant that translates text.',
      model_id: '',
      model_provider: 'openai',
      temperature: 0.7,
      top_p: 1.0
    };
  }

  async function handleSubmit() {
    const dataToSubmit = {
      ...formData,
      temperature: Number(formData.temperature),
      top_p: Number(formData.top_p)
    };

    if (editingAgent) {
      await agentStore.updateAgent(editingAgent.id, dataToSubmit);
      // Force a refresh of the agents data after successful update
      if (!$agentStore.error) {
        // The store should have already updated, but let's ensure UI reflects changes
        editingAgent = null;
        resetForm();
        dialogOpen = false;
      }
    } else {
      await agentStore.addAgent(dataToSubmit);
      if (!$agentStore.error) {
        resetForm();
        dialogOpen = false;
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this agent?')) {
        await agentStore.deleteAgent(id);
    }
  }

  function editAgent(agent: Agent) {
    editingAgent = agent;
    formData = {
      custom_name: agent.custom_name,
      prompt: agent.prompt,
      model_id: agent.model,
      model_provider: agent.model_provider,
      temperature: agent.temperature,
      top_p: agent.top_p
    };
    dialogOpen = true;
  }

  function resetForm() {
    editingAgent = null;
    formData = {
      custom_name: '',
      prompt: 'You are a helpful assistant that translates text.',
      model_id: '',
      model_provider: 'openai',
      temperature: 0.7,
      top_p: 1.0
    };
  }

  // Modal state
  let showCreateModal = false;

  async function createAgent() {
    try {
      await agentStore.addAgent(formData);
      showCreateModal = false;
      resetForm();
    } catch (error: any) {
      logger.error('Failed to create agent', error);
    }
  }

  async function updateAgent() {
    if (!editingAgent) return;
    try {
      await agentStore.updateAgent(editingAgent.id, formData);
      editingAgent = null;
      dialogOpen = false;
      resetForm();
    } catch (error: any) {
      logger.error('Failed to update agent', error);
    }
  }

  // Helper functions for model filtering and display
  function getAvailableModels(store: any) {
    const modelLogger = logger.scope('ModelFiltering');
    modelLogger.debug('Getting available models', { hasModels: !!store.models, modelCount: store.models?.length });
    
    if (!store.models || store.models.length === 0) {
      modelLogger.debug('No models in store');
      return [];
    }
    
    // Temporarily show all models to fix the dropdown issue
    const allModels = store.models.filter((model: any) => {
      const isActive = model.is_active !== undefined ? model.is_active : true;
      return isActive;
    });
    
    modelLogger.debug('Available models filtered', { availableCount: allModels.length });
    return allModels;
  }

  function getModelDisplayName(model: any) {
    const provider = model.provider.toUpperCase();
    const tokens = model.context_length ? ` - ${model.context_length.toLocaleString()} tokens` : '';
    const apiKey = $modelStore.apiKeys.find(k => k.id === model.api_key_id);
    const apiKeyLabel = apiKey ? ` [${apiKey.name}]` : '';
    return `${model.name} (${provider})${tokens}${apiKeyLabel}`;
  }

  // New reactive variables
  $: selectedModel = filteredModels.find(m => m.id === formData.model_id);
  $: apiKey = selectedModel && selectedModel.api_key_id
    ? $modelStore.apiKeys.find(k => k.id === selectedModel.api_key_id)
    : null;
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
        <!-- Always visible Create Agent button -->
        <Button 
          on:click={() => {
            resetForm();
            dialogOpen = true;
          }}
        >
          Create Agent
        </Button>
      </div>
    </div>

    <!-- Dialog Modal -->
    <Dialog bind:open={dialogOpen}>
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
        </DialogHeader>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4 pt-4">
              <div>
                  <label for="agent-name" class="block text-sm font-medium mb-1">Name</label>
                  <input
                    id="agent-name"
                    type="text"
                    placeholder="e.g., 'Spanish Marketing Translator'"
                    bind:value={formData.custom_name}
                    required
                    minlength="1"
                    class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />

              </div>

              <div>
                <label for="agent-prompt" class="block text-sm font-medium mb-1">System Prompt</label>
                <Textarea
                  id="agent-prompt"
                  placeholder="Define the agent's role and instructions."
                  bind:value={formData.prompt}
                  rows={5}
                  required
                />
              </div>

              <div class="mb-4">
                <label for="agent-provider" class="block text-sm font-medium mb-1">Provider & API Key</label>
                <select id="agent-provider" bind:value={selectedProviderKeyId} class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                  <option value="">Select a provider & key</option>
                  {#each providerKeyOptions as option}
                    <option value={option.keyId}>{option.label}</option>
                  {/each}
                </select>
              </div>

              <!-- Model dropdown (only after provider-key is selected) -->
              {#if selectedProviderKey}
                <div class="mb-4">
                  <div class="flex justify-between items-center mb-1">
                    <label for="agent-model" class="block text-sm font-medium">Model</label>
                    <button 
                      type="button"
                      on:click={() => modelStore.loadModels()}
                      class="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Refresh Models
                    </button>
                  </div>
                  <select
                    id="agent-model"
                    bind:value={formData.model_id}
                    class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a model</option>
                    {#each filteredModels as model}
                      <option value={model.id}>{getModelDisplayName(model)}</option>
                    {/each}
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    Found {filteredModels.length} models for {selectedProviderKey.label}
                  </p>
                  {#if selectedProviderKey}
                    <p class="text-xs text-gray-500 mt-1">API Key: {selectedProviderKey.name}</p>
                  {/if}
                </div>
              {/if}

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="agent-temperature" class="block text-sm font-medium mb-1">
                    Temperature
                    <span class="text-xs text-gray-500 font-normal">(0.0 - 2.0)</span>
                  </label>
                  <Input
                    id="agent-temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    bind:valueAsNumber={formData.temperature}
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Controls randomness: 0 = focused, 1 = balanced, 2 = creative
                  </p>
                </div>
                <div>
                  <label for="agent-top-p" class="block text-sm font-medium mb-1">
                    Top P
                    <span class="text-xs text-gray-500 font-normal">(0.0 - 1.0)</span>
                  </label>
                  <Input
                    id="agent-top-p"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    bind:valueAsNumber={formData.top_p}
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Controls diversity: 0.1 = focused, 1.0 = all options
                  </p>
                </div>
              </div>

              {#if $agentStore.error}
                <p class="text-red-500 text-sm">Error: {$agentStore.error}</p>
              {/if}

              <div class="flex justify-end gap-2 pt-4">
                <Button variant="secondary" type="button" on:click={() => dialogOpen = false}>
                  Cancel
                </Button>
                <Button type="submit" disabled={$agentStore.loading}>
                  {$agentStore.loading ? 'Saving...' : (editingAgent ? 'Save Changes' : 'Create Agent')}
                </Button>
              </div>
            </form>
      </DialogContent>
    </Dialog>

    <!-- Loading State -->
    {#if $agentStore.loading && $agentStore.agents.length === 0}
        <div class="text-center py-4">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p class="mt-2 text-sm text-gray-500">Loading agents...</p>
        </div>
    {:else if $agentStore.error}
        <div class="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-6">
            <div class="flex items-center">
                <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <div>
                    <h3 class="text-sm font-medium text-red-800">Connection Error</h3>
                    <p class="text-sm text-red-700 mt-1">{$agentStore.error}</p>
                    <p class="text-sm text-red-600 mt-2">You can still create agents - they will be saved once the connection is restored.</p>
                </div>
            </div>
        </div>
        <!-- Show empty state even with error so user can still interact -->
        <div class="text-center py-12">
            <h3 class="mt-2 text-lg font-medium text-gray-900">No Agents Configured</h3>
            <p class="mt-1 text-sm text-gray-500">
                Get started by creating your first AI translation agent.
            </p>
            <div class="mt-6">
                <Button on:click={() => dialogOpen = true}>Create Agent</Button>
            </div>
        </div>
    {:else if $agentStore.agents.length === 0}
      <!-- Empty State -->
      <div class="text-center py-12">
        <h3 class="mt-2 text-lg font-medium text-gray-900">No Agents Configured</h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by creating your first AI translation agent.
        </p>
        <div class="mt-6">
            <Button on:click={() => dialogOpen = true}>Create Agent</Button>
        </div>
      </div>
    {:else}
      <!-- Agent Cards -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each $agentStore.agents as agent (agent.id)}
          <Card class="flex flex-col">
            <CardHeader>
                <div class="flex justify-between items-start">
                    <CardTitle class="text-lg font-semibold text-gray-900">
                      {agent.custom_name || 'Unnamed Agent'}
                    </CardTitle>
                    <span class="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800 capitalize">
                        {agent.model}
                    </span>
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  Model: <span class="font-medium text-gray-700">{agent.model}</span>
                </div>
            </CardHeader>
            <CardContent class="flex-grow">
              <p class="text-sm text-gray-600 line-clamp-3" title={agent.prompt}>
                {agent.prompt}
              </p>
            </CardContent>
            <CardFooter class="flex justify-between items-center">
                <div class="text-sm text-gray-500">
                    Provider: <span class="font-medium text-gray-700 capitalize">{agent.model_provider}</span>
                </div>
              <div class="flex gap-2">
                <Button variant="secondary" size="sm" on:click={() => editAgent(agent)}>Edit</Button>
                <Button variant="danger" size="sm" on:click={() => handleDelete(agent.id)}>Delete</Button>
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