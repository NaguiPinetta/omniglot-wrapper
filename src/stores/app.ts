import { writable } from 'svelte/store';
import type { Agent, Glossary, Dataset, Job, User } from '../../types';

// Application state store
export const appStore = writable({
  user: null as User | null,
  agents: [] as Agent[],
  glossaries: [] as Glossary[],
  datasets: [] as Dataset[],
  jobs: [] as Job[],
  isLoading: false,
  error: null as string | null,
});

// Individual stores for better granularity
export const agentsStore = writable<Agent[]>([]);
export const glossariesStore = writable<Glossary[]>([]);
export const datasetsStore = writable<Dataset[]>([]);
export const jobsStore = writable<Job[]>([]);
export const userStore = writable<User | null>(null);

// UI state stores
export const loadingStore = writable(false);
export const errorStore = writable<string | null>(null);
export const notificationStore = writable<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
} | null>(null);

// Store actions
export const appActions = {
  setLoading: (loading: boolean) => {
    loadingStore.set(loading);
    appStore.update(state => ({ ...state, isLoading: loading }));
  },

  setError: (error: string | null) => {
    errorStore.set(error);
    appStore.update(state => ({ ...state, error }));
  },

  showNotification: (notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }) => {
    notificationStore.set(notification);
  },

  clearNotification: () => {
    notificationStore.set(null);
  },

  // Agent actions
  setAgents: (agents: Agent[]) => {
    agentsStore.set(agents);
    appStore.update(state => ({ ...state, agents }));
  },

  addAgent: (agent: Agent) => {
    agentsStore.update(agents => [...agents, agent]);
    appStore.update(state => ({ ...state, agents: [...state.agents, agent] }));
  },

  updateAgent: (id: string, updates: Partial<Agent>) => {
    agentsStore.update(agents => 
      agents.map(agent => agent.id === id ? { ...agent, ...updates } : agent)
    );
    appStore.update(state => ({
      ...state,
      agents: state.agents.map(agent => agent.id === id ? { ...agent, ...updates } : agent)
    }));
  },

  // Glossary actions
  setGlossaries: (glossaries: Glossary[]) => {
    glossariesStore.set(glossaries);
    appStore.update(state => ({ ...state, glossaries }));
  },

  addGlossary: (glossary: Glossary) => {
    glossariesStore.update(glossaries => [...glossaries, glossary]);
    appStore.update(state => ({ ...state, glossaries: [...state.glossaries, glossary] }));
  },

  // Dataset actions
  setDatasets: (datasets: Dataset[]) => {
    datasetsStore.set(datasets);
    appStore.update(state => ({ ...state, datasets }));
  },

  addDataset: (dataset: Dataset) => {
    datasetsStore.update(datasets => [...datasets, dataset]);
    appStore.update(state => ({ ...state, datasets: [...state.datasets, dataset] }));
  },

  // Job actions
  setJobs: (jobs: Job[]) => {
    jobsStore.set(jobs);
    appStore.update(state => ({ ...state, jobs }));
  },

  addJob: (job: Job) => {
    jobsStore.update(jobs => [...jobs, job]);
    appStore.update(state => ({ ...state, jobs: [...state.jobs, job] }));
  },

  updateJob: (id: string, updates: Partial<Job>) => {
    jobsStore.update(jobs => 
      jobs.map(job => job.id === id ? { ...job, ...updates } : job)
    );
    appStore.update(state => ({
      ...state,
      jobs: state.jobs.map(job => job.id === id ? { ...job, ...updates } : job)
    }));
  },

  // User actions
  setUser: (user: User | null) => {
    userStore.set(user);
    appStore.update(state => ({ ...state, user }));
  },
}; 