import { getAgents } from '$lib/agents/api';
import { getApiKeys, getModels } from '$lib/models/api';
import type { PageServerLoad } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
	const serverSupabase = createServerSupabaseClient(fetch);
		const [agents, apiKeys, models] = await Promise.all([
			getAgents({ client: serverSupabase }),
			getApiKeys({ client: serverSupabase }),
			getModels({ client: serverSupabase })
		]);
		
		console.log('Server load - Agents:', agents.length);
		console.log('Server load - API Keys:', apiKeys.length);
		console.log('Server load - Models:', models.length);
		console.log('Server load - Models data:', models);
		
		return { agents, apiKeys, models };
	} catch (err) {
		console.error('Error loading data:', err);
		return {
			agents: [],
			apiKeys: [],
			models: [],
			error: err instanceof Error ? err.message : 'Failed to load data'
		};
	}
}; 