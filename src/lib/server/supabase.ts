import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '$env/static/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

export const createServerSupabaseClient = async (event: RequestEvent): Promise<SupabaseClient> => {
	// Create a wrapper around fetch that handles SSL issues
	const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		// Set NODE_TLS_REJECT_UNAUTHORIZED for this process if not already set
		if (typeof process !== 'undefined' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		}
		
		return event.fetch(input, init);
	};

	console.log('DEBUG: SUPABASE_URL:', SUPABASE_URL);
	console.log('DEBUG: SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY);

	const client = createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
		global: {
			fetch: wrappedFetch
		},
		auth: {
			flowType: 'pkce',
			autoRefreshToken: false,
			detectSessionInUrl: false,
			persistSession: false
		}
	});

	// If we have a session from the hooks, set it on the client
	if (event.locals.session) {
		console.log('Setting session on server client for user:', event.locals.session.user?.email);
		console.log('Session access_token preview:', event.locals.session.access_token?.substring(0, 20) + '...');
		
		// Set the session and wait for it to complete
		const { data, error } = await client.auth.setSession({
			access_token: event.locals.session.access_token,
			refresh_token: event.locals.session.refresh_token
		});
		
		if (error) {
			console.error('Error setting session on server client:', error);
		} else {
			console.log('Session set successfully on server client');
			// Verify the session was set
			const { data: { user }, error: userError } = await client.auth.getUser();
			console.log('Verified server client user after setting session:', user?.email || 'No user');
			if (userError) {
				console.error('Error getting user after setting session:', userError);
			}
		}
	} else {
		console.log('No session found in event.locals');
		console.log('Available locals keys:', Object.keys(event.locals));
	}

	return client;
}; 