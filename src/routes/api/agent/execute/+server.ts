import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { executeAgent } from '$lib/agents/api';

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const { agentId, message } = body;
		
		if (!agentId || !message) {
			return json({ error: 'Agent ID and message are required' }, { status: 400 });
		}
		
		const client = await createServerSupabaseClient(event);
		const result = await executeAgent(agentId, message, { client });
		
		return json(result);
	} catch (error) {
		return json({ error: 'Failed to execute agent' }, { status: 500 });
	}
}; 