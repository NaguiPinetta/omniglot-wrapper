import { getGlossaryEntries } from '$lib/glossary/api';
import type { PageServerLoad } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const serverSupabase = createServerSupabaseClient(fetch);
		const entries = await getGlossaryEntries({ client: serverSupabase });
		return {
			entries,
			error: null
		};
	} catch (e) {
		console.error('Error loading glossary:', e);
		return {
			entries: [],
			error: e instanceof Error ? e.message : 'Failed to load glossary entries'
		};
	}
}; 