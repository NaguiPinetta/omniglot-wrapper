import { getGlossaryEntries, getModules } from '$lib/glossary/api';
import type { PageServerLoad } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const serverSupabase = createServerSupabaseClient(fetch);
		const [entries, modules] = await Promise.all([
			getGlossaryEntries({ client: serverSupabase }),
			getModules({ client: serverSupabase })
		]);
		return {
			entries,
			modules,
			error: null
		};
	} catch (e) {
		console.error('Error loading glossary:', e);
		return {
			entries: [],
			modules: [],
			error: e instanceof Error ? e.message : 'Failed to load glossary entries'
		};
	}
}; 