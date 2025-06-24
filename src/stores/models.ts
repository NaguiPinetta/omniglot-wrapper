import { writable } from 'svelte/store';
import type { Model, ApiKey, ModelStore, ApiKeyFormData } from '../types/models';
import { getModels, getApiKeys, createApiKey, deleteApiKey, getModelsByProvider } from '../lib/models/api';

const initialState: ModelStore = {
	models: [],
	apiKeys: [],
	loading: false,
	error: null
};

function createModelStore() {
	const { subscribe, set, update } = writable<ModelStore>(initialState);

	return {
		subscribe,

		async loadModels() {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				const models = await getModels();
				update(state => ({ ...state, models, loading: false }));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load models';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async loadApiKeys() {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				const apiKeys = await getApiKeys();
				update(state => ({ ...state, apiKeys, loading: false }));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load API keys';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async loadAll() {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				const [models, apiKeys] = await Promise.all([getModels(), getApiKeys()]);
				update(state => ({ ...state, models, apiKeys, loading: false }));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async addApiKey(apiKeyData: ApiKeyFormData) {
			console.log('Store addApiKey called with:', apiKeyData);
			update(state => ({ ...state, loading: true, error: null }));
			try {
				console.log('Calling createApiKey API...');
				const newApiKey = await createApiKey(apiKeyData);
				console.log('API call successful, new API key:', newApiKey);
				update(state => ({
					...state,
					apiKeys: [newApiKey, ...state.apiKeys],
					loading: false
				}));
			} catch (error) {
				console.error('Error in addApiKey:', error);
				const errorMessage = error instanceof Error ? error.message : 'Failed to create API key';
				console.log('Setting error message:', errorMessage);
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async deleteApiKey(id: string) {
			update(state => ({ ...state, loading: true, error: null }));
			try {
				await deleteApiKey(id);
				update(state => ({
					...state,
					apiKeys: state.apiKeys.filter(key => key.id !== id),
					loading: false
				}));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to delete API key';
				update(state => ({ ...state, loading: false, error: errorMessage }));
			}
		},

		async getModelsByProvider(provider: string): Promise<Model[]> {
			try {
				return await getModelsByProvider(provider);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load models for provider';
				update(state => ({ ...state, error: errorMessage }));
				return [];
			}
		},

		setModels(models: Model[]) {
			update(state => ({ ...state, models, error: null }));
		},

		setApiKeys(apiKeys: ApiKey[]) {
			update(state => ({ ...state, apiKeys, error: null }));
		},

		setError(error: string) {
			update(state => ({ ...state, error }));
		},

		clearError() {
			update(state => ({ ...state, error: null }));
		}
	};
}

export const modelStore = createModelStore(); 