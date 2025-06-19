import { writable } from 'svelte/store';
import type { Dataset, DatasetStore } from '../types/datasets';
import { getDatasets } from '../lib/datasets/api';

function createDatasetStore() {
  const { subscribe, set, update } = writable<DatasetStore>({
    datasets: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    // Load all datasets
    async loadDatasets() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const datasets = await getDatasets();
        update(state => ({ ...state, datasets }));
      } catch (error) {
        update(state => ({ ...state, error: error instanceof Error ? error.message : 'Failed to load datasets' }));
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    // Add a new dataset
    addDataset(dataset: Dataset) {
      update(state => ({
        ...state,
        datasets: [dataset, ...state.datasets]
      }));
    },

    // Update an existing dataset
    updateDataset(updatedDataset: Dataset) {
      update(state => ({
        ...state,
        datasets: state.datasets.map(d => 
          d.id === updatedDataset.id ? updatedDataset : d
        )
      }));
    },

    // Remove a dataset
    removeDataset(id: string) {
      update(state => ({
        ...state,
        datasets: state.datasets.filter(d => d.id !== id)
      }));
    },

    // Reset the store
    reset() {
      set({
        datasets: [],
        loading: false,
        error: null
      });
    }
  };
}

export const datasetStore = createDatasetStore(); 