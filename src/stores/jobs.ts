import { writable } from 'svelte/store';
import type { Job, JobStore } from '../types/jobs';
import { getJobs, createJob, updateJob, deleteJob, startJob, cancelJob } from '../lib/jobs/api';

function createJobStore() {
  const { subscribe, set, update } = writable<JobStore>({
    jobs: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    async loadJobs() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const jobs = await getJobs();
        set({ jobs, loading: false, error: null });
      } catch (error) {
        set({ jobs: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load jobs' });
      }
    },

    async addJob(jobData: Omit<Job, 'id' | 'created_at' | 'status' | 'progress' | 'total_items' | 'processed_items' | 'failed_items'>) {
        const job: Omit<Job, 'id' | 'created_at'> = {
            ...jobData,
            status: 'pending',
            progress: 0,
            total_items: 0,
            processed_items: 0,
            failed_items: 0,
        };
      update(state => ({ ...state, loading: true }));
      try {
        await createJob(job);
        await this.loadJobs();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to create job' }));
      }
    },

    async updateJob(id: string, job: Partial<Job>) {
      update(state => ({ ...state, loading: true }));
      try {
        await updateJob(id, job);
        await this.loadJobs();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to update job' }));
      }
    },

    async deleteJob(id: string) {
      update(state => ({ ...state, loading: true }));
      try {
        await deleteJob(id);
        await this.loadJobs();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to delete job' }));
      }
    },

    async startJob(id: string) {
        update(state => ({ ...state, loading: true }));
        try {
          await startJob(id);
          await this.loadJobs();
        } catch (error) {
          update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to start job' }));
        }
    },

    async cancelJob(id: string) {
        update(state => ({ ...state, loading: true }));
        try {
          await cancelJob(id);
          await this.loadJobs();
        } catch (error) {
          update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to cancel job' }));
        }
    }
  };
}

export const jobStore = createJobStore(); 