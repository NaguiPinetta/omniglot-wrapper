import { writable } from 'svelte/store';
import type { Dataset, DatasetStore, DatasetFormData } from '../types/datasets';
import { getDatasets, uploadAndCreateDataset, updateDataset, deleteDataset } from '../lib/datasets/api';
import { logger } from '../lib/utils/logger';

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
      const storeLogger = logger.scope('DatasetStore');
      storeLogger.debug('Starting dataset upload', { 
        name: formData.name, 
        description: formData.description, 
        hasFile: !!formData.file,
        fileName: formData.file?.name 
      });
      
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const result = await uploadAndCreateDataset(formData);
        storeLogger.debug('Dataset uploaded successfully', { datasetId: result.dataset.id });
        await this.loadDatasets();
        storeLogger.info('Dataset creation completed successfully');
      } catch (error) {
        storeLogger.error('Error in addDataset', error);
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