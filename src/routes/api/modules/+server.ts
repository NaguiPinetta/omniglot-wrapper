import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerSupabaseClient } from '$lib/server/supabase';
import { z } from 'zod';

const ModuleSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional()
});

export const GET: RequestHandler = async (event) => {
	try {
		const client = await createServerSupabaseClient(event);
		const { data, error } = await client.from('modules').select('*').order('name');
		
		if (error) {
			throw error;
		}
		
		return json(data || []);
	} catch (error) {
		return json({ error: 'Failed to fetch modules' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const client = await createServerSupabaseClient(event);
		
		// Validate input
		const parse = ModuleSchema.safeParse(body);
		if (!parse.success) {
			return json({ error: 'Invalid module data', details: parse.error.flatten() }, { status: 400 });
		}
		
		const { name, description } = parse.data;
		
		const { data, error } = await client
			.from('modules')
			.insert([{ name, description: description || '' }])
			.select()
			.single();
		
		if (error) {
			return json({ error: 'Failed to create module' }, { status: 500 });
		}
		
		return json(data);
	} catch (error) {
		return json({ error: 'Failed to create module' }, { status: 500 });
	}
}; 