import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Test basic fetch to Supabase without our wrapper
		const url = `${env.PUBLIC_SUPABASE_URL}/rest/v1/agents?select=*&limit=1`;
		const headers = {
			'apikey': env.PUBLIC_SUPABASE_ANON_KEY!,
			'Authorization': `Bearer ${env.PUBLIC_SUPABASE_ANON_KEY}`,
			'Content-Type': 'application/json'
		};

		console.log('Testing direct fetch to:', url);
		console.log('Headers:', { ...headers, apikey: 'HIDDEN', Authorization: 'HIDDEN' });

		const response = await fetch(url, {
			method: 'GET',
			headers
		});

		console.log('Response status:', response.status);
		console.log('Response headers:', Object.fromEntries(response.headers.entries()));

		if (!response.ok) {
			const errorText = await response.text();
			console.log('Error response:', errorText);
			return {
				success: false,
				error: `HTTP ${response.status}: ${response.statusText}`,
				details: errorText,
				url,
				env: {
					url: env.PUBLIC_SUPABASE_URL,
					keyLength: env.PUBLIC_SUPABASE_ANON_KEY?.length
				}
			};
		}

		const data = await response.json();
		console.log('Success! Data:', data);

		return {
			success: true,
			data,
			url,
			env: {
				url: env.PUBLIC_SUPABASE_URL,
				keyLength: env.PUBLIC_SUPABASE_ANON_KEY?.length
			}
		};

	} catch (error) {
		console.error('Fetch error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			details: error,
			env: {
				url: env.PUBLIC_SUPABASE_URL,
				keyLength: env.PUBLIC_SUPABASE_ANON_KEY?.length
			}
		};
	}
}; 