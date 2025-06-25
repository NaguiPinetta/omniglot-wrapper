import { writable } from 'svelte/store';
import type { Dataset, DatasetStore, DatasetFormData } from '../types/datasets';
import { getDatasets, uploadAndCreateDataset, updateDataset, deleteDataset } from '../lib/datasets/api';

function createDatasetStore() {
  const { subscribe, set, update } = writable<DatasetStore>({
    datasets: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    set,
    
    async loadDatasets() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const datasets = await getDatasets();
        set({ datasets, loading: false, error: null });
      } catch (error) {
        set({ datasets: [], loading: false, error: error instanceof Error ? error.message : 'Failed to load datasets' });
      }
    },

    async addDataset(formData: DatasetFormData) {
      update(state => ({ ...state, loading: true }));
      try {
        await uploadAndCreateDataset(formData);
        await this.loadDatasets();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to add dataset' }));
      }
    },

    async updateDataset(id: string, dataset: Partial<Dataset>) {
      update(state => ({ ...state, loading: true }));
      try {
        await updateDataset(id, dataset);
        await this.loadDatasets();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to update dataset' }));
      }
    },

    async deleteDataset(id: string) {
      update(state => ({ ...state, loading: true }));
      try {
        await deleteDataset(id);
        await this.loadDatasets();
      } catch (error) {
        update(state => ({ ...state, loading: false, error: error instanceof Error ? error.message : 'Failed to delete dataset' }));
      }
    },
  };
}

export const datasetStore = createDatasetStore(); 