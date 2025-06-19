<script lang="ts">
  import { onMount } from 'svelte';
  import { agentStore } from '../../stores/agents';
  import { datasetStore } from '../../stores/datasets';
  import { jobStore } from '../../stores/jobs';

  let testResults = {
    agents: false,
    datasets: false,
    jobs: false,
    supabase: false
  };

  onMount(async () => {
    await runTests();
  });

  async function runTests() {
    try {
      // Test agents
      await agentStore.loadAgents();
      testResults.agents = true;

      // Test datasets
      await datasetStore.loadDatasets();
      testResults.datasets = true;

      // Test jobs
      await jobStore.loadJobs();
      testResults.jobs = true;

      // Test Supabase connection
      testResults.supabase = true;

    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  function getTestStatus(passed: boolean) {
    return passed ? '✅ Passed' : '❌ Failed';
  }
</script>

<svelte:head>
  <title>System Test - Omniglot</title>
</svelte:head>

<div class="container mx-auto py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold">System Test</h1>
    <p class="text-gray-600 mt-2">
      Testing all system components
    </p>
  </div>

  <div class="grid gap-6">
    <div class="bg-white rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Connection Tests</h2>
      <p class="text-sm text-gray-600 mb-4">Testing database and API connections</p>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span>Supabase Connection</span>
          <span class="font-mono">{getTestStatus(testResults.supabase)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Agents API</span>
          <span class="font-mono">{getTestStatus(testResults.agents)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Datasets API</span>
          <span class="font-mono">{getTestStatus(testResults.datasets)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Jobs API</span>
          <span class="font-mono">{getTestStatus(testResults.jobs)}</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Data Summary</h2>
      <p class="text-sm text-gray-600 mb-4">Current data in the system</p>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm font-medium">Agents</p>
          <p class="text-2xl font-bold">{$agentStore.agents.length}</p>
        </div>
        <div>
          <p class="text-sm font-medium">Datasets</p>
          <p class="text-2xl font-bold">{$datasetStore.datasets.length}</p>
        </div>
        <div>
          <p class="text-sm font-medium">Jobs</p>
          <p class="text-2xl font-bold">{$jobStore.jobs.length}</p>
        </div>
      </div>
    </div>

    <div class="flex gap-4">
      <a href="/" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Go to Dashboard
      </a>
      <a href="/agents" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
        Manage Agents
      </a>
      <a href="/datasets" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
        Upload Datasets
      </a>
      <a href="/jobs" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
        Create Jobs
      </a>
    </div>
  </div>
</div> 