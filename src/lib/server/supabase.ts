import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '$env/static/private';

export const createServerSupabaseClient = async (event: RequestEvent, session?: any): Promise<SupabaseClient> => {
	if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
		throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in .env');
	}
	
	const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	// Set session if provided directly or available in event.locals
	const sessionToUse = session || event.locals.session;
	if (sessionToUse) {
		await client.auth.setSession({
			access_token: sessionToUse.access_token,
			refresh_token: sessionToUse.refresh_token
		});
		
		// Verify session was set correctly
		const { data: { user } } = await client.auth.getUser();
		if (!user) {
			throw new Error('Failed to authenticate user session');
		}
	}

	return client;
}; 