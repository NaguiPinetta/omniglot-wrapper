import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ fetch }) => {
	const headers = {
		'Content-Type': 'application/json',
		'apikey': env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
		'Authorization': `Bearer ${env.PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
	};

	try {
		// Test basic connection
		const response = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/`, {
			headers,
		});

		const isConnected = response.ok;
		const statusCode = response.status;

		// Test agents table
		const agentsResponse = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/agents?select=*&limit=1`, {
			headers,
		});

		const agentsData = agentsResponse.ok ? await agentsResponse.json() : null;
		const agentsError = agentsResponse.ok ? null : await agentsResponse.text();

		// Test glossaries table
		const glossariesResponse = await fetch(`${env.PUBLIC_SUPABASE_URL}/rest/v1/glossaries?select=*&limit=1`, {
			headers,
		});

		const glossariesData = glossariesResponse.ok ? await glossariesResponse.json() : null;
		const glossariesError = glossariesResponse.ok ? null : await glossariesResponse.text();

		return {
			supabase: {
				url: env.PUBLIC_SUPABASE_URL,
				keyLength: env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length
			},
			connection: {
				isConnected,
				statusCode
			},
			agents: {
				data: agentsData,
				error: agentsError,
				keyLength: env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length
			},
			glossaries: {
				data: glossariesData,
				error: glossariesError,
				keyLength: env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length
			}
		};
	} catch (error) {
		console.error('Debug page error:', error);
		return {
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}; 