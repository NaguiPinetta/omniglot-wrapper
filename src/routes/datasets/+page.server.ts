import { getDatasets } from '$lib/datasets/api';
import { createServerSupabaseClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const client = await createServerSupabaseClient(event);
		const datasets = await getDatasets({ client });
		return {
			datasets,
			error: null
		};
	} catch (error) {
		console.error('Error loading datasets:', error);
		// Return empty datasets instead of failing
		return {
			datasets: [],
			error: error instanceof Error ? error.message : 'Failed to load datasets'
		};
	}
}; 