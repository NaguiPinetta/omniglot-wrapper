import type { PageServerLoad } from './$types';
import { getModels, getApiKeys } from '$lib/models/api';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const serverSupabase = createServerSupabaseClient(fetch);
		const [models, apiKeys] = await Promise.all([
			getModels({ client: serverSupabase }),
			getApiKeys({ client: serverSupabase })
		]);
		return { models, apiKeys };
	} catch (err) {
		console.error('Error loading models and API keys:', err);
		return {
			models: [],
			apiKeys: [],
			error: err instanceof Error ? err.message : 'Failed to load data'
		};
	}
}; 