import { writable } from 'svelte/store';
import type { Job, JobStore } from '../types/jobs';
import { getJobs } from '../lib/jobs/api';

function createJobStore() {
  const { subscribe, set, update } = writable<JobStore>({
    jobs: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    // Load all jobs
    async loadJobs() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const jobs = await getJobs();
        update(state => ({ ...state, jobs }));
      } catch (error) {
        update(state => ({ ...state, error: error instanceof Error ? error.message : 'Failed to load jobs' }));
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    // Add a new job
    addJob(job: Job) {
      update(state => ({
        ...state,
        jobs: [job, ...state.jobs]
      }));
    },

    // Update an existing job
    updateJob(updatedJob: Job) {
      update(state => ({
        ...state,
        jobs: state.jobs.map(j => 
          j.id === updatedJob.id ? updatedJob : j
        )
      }));
    },

    // Remove a job
    removeJob(id: string) {
      update(state => ({
        ...state,
        jobs: state.jobs.filter(j => j.id !== id)
      }));
    },

    // Reset the store
    reset() {
      set({
        jobs: [],
        loading: false,
        error: null
      });
    }
  };
}

export const jobStore = createJobStore(); 