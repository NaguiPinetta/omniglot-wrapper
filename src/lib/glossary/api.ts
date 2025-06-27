import { supabaseClient } from '../supabaseClient';
import type { GlossaryEntry } from '../../types/glossary';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getGlossaryEntries({
	client = supabaseClient
}: { client?: SupabaseClient } = {}): Promise<GlossaryEntry[]> {
	// Join with modules to get module name
	const { data, error } = await client
		.from('glossary')
		.select('*, modules(name)');
	if (error) throw error;
	// Map module name for display
	return (data ?? []).map((entry: any) => ({
		...entry,
		module_name: entry.modules?.name || null
	}));
}

export async function getModules({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<{ id: string; name: string; description?: string }[]> {
	const { data, error } = await client.from('modules').select('*').order('name');
	if (error) throw error;
	return data ?? [];
}

export async function createGlossaryEntry(
	entry: Omit<GlossaryEntry, 'id' | 'created_at' | 'module_name'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<GlossaryEntry> {
	const { data, error } = await client.from('glossary').insert([entry]).select('*, modules(name)').single();
	if (error) throw error;
	return { ...data, module_name: data.modules?.name || null };
}

export async function updateGlossaryEntry(
	id: string,
	entry: Partial<Omit<GlossaryEntry, 'id' | 'created_at' | 'module_name'>>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<GlossaryEntry> {
	const { data, error } = await client.from('glossary').update(entry).eq('id', id).select('*, modules(name)').single();
	if (error) throw error;
	return { ...data, module_name: data.modules?.name || null };
}

export async function deleteGlossaryEntry(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const { error } = await client.from('glossary').delete().eq('id', id);
	if (error) throw error;
}

export async function updateLastUsed(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const { error } = await client
		.from('glossary_terms')
		.update({
			last_used: new Date().toISOString()
		})
		.eq('id', id);

	if (error) throw error;
} 