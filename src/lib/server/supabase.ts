import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
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

	return createClient(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!, {
		global: {
			fetch: wrappedFetch
		}
	});
}; 