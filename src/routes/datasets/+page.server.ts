import type { PageServerLoad } from './$types';
import { getDatasets } from '$lib/datasets/api';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const serverSupabase = createServerSupabaseClient(fetch);
		const datasets = await getDatasets({ client: serverSupabase });
		return {
			datasets: datasets || []
		};
	} catch (error) {
		console.error('Error loading datasets:', error);
		return {
			datasets: [],
			error: error instanceof Error ? error.message : 'Failed to load datasets'
		};
	}
}; 