import { supabaseClient } from '../supabaseClient';
import type { GlossaryEntry } from '../../types/glossary';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getGlossaryEntries({
	client = supabaseClient
}: { client?: SupabaseClient } = {}): Promise<GlossaryEntry[]> {
	const { data, error } = await client.from('glossary').select('*');
	if (error) throw error;
	return data ?? [];
}

export async function createGlossaryEntry(
	entry: Omit<GlossaryEntry, 'id' | 'created_at'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<GlossaryEntry> {
	const { data, error } = await client.from('glossary').insert([entry]).select().single();
	if (error) throw error;
	return data;
}

export async function updateGlossaryEntry(
	id: string,
	entry: Partial<GlossaryEntry>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<GlossaryEntry> {
	const { data, error } = await client.from('glossary').update(entry).eq('id', id).select().single();
	if (error) throw error;
	return data;
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