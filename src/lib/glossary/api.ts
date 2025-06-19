import { supabaseClient } from '../supabaseClient';
import type { GlossaryEntry, GlossaryFormData } from '../../types/glossary';

export async function getGlossary(): Promise<GlossaryEntry[]> {
  const { data, error } = await supabaseClient
    .from('glossary_terms')
    .select('*')
    .order('term', { ascending: true });
  
  if (error) throw error;
  return data ?? [];
}

export async function addGlossaryEntry(entry: GlossaryFormData): Promise<GlossaryEntry> {
  const { data, error } = await supabaseClient
    .from('glossary_terms')
    .insert([{
      source_term: entry.term,
      target_term: entry.translation,
      note: entry.note,
      context: entry.context,
      language: entry.language || 'es'
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    term: data.source_term,
    translation: data.target_term,
    note: data.note,
    context: data.context,
    language: data.language,
    created_at: data.created_at
  };
}

export async function updateGlossaryEntry(id: string, updates: GlossaryFormData): Promise<void> {
  const { error } = await supabaseClient
    .from('glossary_terms')
    .update({
      source_term: updates.term,
      target_term: updates.translation,
      note: updates.note,
      context: updates.context,
      language: updates.language
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteGlossaryEntry(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('glossary_terms')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateLastUsed(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('glossary_terms')
    .update({
      last_used: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
} 