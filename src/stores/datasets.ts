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
      console.log('=== DATASET STORE DEBUG START ===');
      console.log('Dataset store: Starting dataset upload...');
      console.log('FormData:', { 
        name: formData.name, 
        description: formData.description, 
        hasFile: !!formData.file,
        fileName: formData.file?.name 
      });
      
      update(state => ({ ...state, loading: true, error: null }));
      try {
        console.log('Dataset store: Calling uploadAndCreateDataset API...');
        const result = await uploadAndCreateDataset(formData);
        console.log('Dataset store: Dataset uploaded successfully:', result.dataset.id);
        console.log('Dataset store: Reloading datasets...');
        await this.loadDatasets();
        console.log('Dataset store: Datasets reloaded successfully');
        console.log('=== DATASET STORE DEBUG END (SUCCESS) ===');
      } catch (error) {
        console.error('=== DATASET STORE DEBUG END (ERROR) ===');
        console.error('Dataset store: Error in addDataset:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to add dataset' 
        }));
        throw error; // Re-throw so UI can handle it
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