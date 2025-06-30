import type { PageServerLoad } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { getJobs } from '$lib/jobs/api';
import { getAgents } from '$lib/agents/api';
import { getDatasets } from '$lib/datasets/api';

export const load: PageServerLoad = async (event) => {
	const supabase = await createServerSupabaseClient(event);
	
	try {
		const [jobs, agents, datasets] = await Promise.all([
			getJobs({ client: supabase }).catch(() => []),
			getAgents({ client: supabase }).catch(() => []),
			getDatasets({ client: supabase }).catch(() => [])
		]);

		return {
			jobs: jobs || [],
			agents: agents || [],
			datasets: datasets || []
		};
	} catch (error) {
		console.error('Error loading jobs page data:', error);
		return {
			jobs: [],
			agents: [],
			datasets: [],
			error: error instanceof Error ? error.message : 'Failed to load data'
		};
	}
}; 