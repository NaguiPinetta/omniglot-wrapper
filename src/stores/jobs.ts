import { writable } from 'svelte/store';
import type { Job, JobStore, JobFormData } from '../types/jobs';
import { getJobs, createJob, updateJob, deleteJob, startJob, cancelJob } from '../lib/jobs/api';

function createJobStore() {
  const { subscribe, set, update } = writable<JobStore>({
    jobs: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    set,
    
    async loadJobs() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const jobs = await getJobs();
        set({ jobs, loading: false, error: null });
      } catch (error) {
        set({ jobs: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load jobs' });
      }
    },

    async addJob(jobData: JobFormData) {
      console.log('Job store: Starting job creation...');
      update(state => ({ ...state, loading: true, error: null }));
      try {
        console.log('Job store: Calling createJob API...');
        const newJob = await createJob(jobData);
        console.log('Job store: Job created successfully:', newJob.id);
        console.log('Job store: Reloading jobs...');
        await this.loadJobs();
        console.log('Job store: Jobs reloaded successfully');
      } catch (error) {
        console.error('Job store: Error in addJob:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to create job' 
        }));
        throw error; // Re-throw so UI can handle it
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
      console.log('Job store: Starting job with ID:', id);
      update(state => ({ ...state, loading: true, error: null }));
      try {
        console.log('Job store: Calling startJob API...');
        await startJob(id);
        console.log('Job store: Job started successfully');
        console.log('Job store: Reloading jobs...');
        await this.loadJobs();
        console.log('Job store: Jobs reloaded after start');
      } catch (error) {
        console.error('Job store: Error in startJob:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to start job' 
        }));
        throw error; // Re-throw so UI can handle it
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