import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createServerSupabaseClient = (fetch: typeof globalThis.fetch): SupabaseClient => {
	// Create a wrapper around fetch that handles SSL issues
	const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		// Set NODE_TLS_REJECT_UNAUTHORIZED for this process if not already set
		if (typeof process !== 'undefined' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		}
		
		return fetch(input, init);
	};

	console.log('DEBUG: SUPABASE_URL:', SUPABASE_URL);
	console.log('DEBUG: SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);

	return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
		global: {
			fetch: wrappedFetch
		}
	});
}; 