import { getGlossaryEntries, getModules } from '$lib/glossary/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Pass the server fetch function to the API calls
		const [entries, modules] = await Promise.all([
			getGlossaryEntries(fetch),
			getModules(fetch)
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