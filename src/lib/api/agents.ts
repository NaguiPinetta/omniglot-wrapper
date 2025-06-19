import { supabaseClient } from '../supabaseClient';
import type { Agent } from '../supabaseClient';

export async function testConnection() {
  const { data, error } = await supabaseClient.from('agents').select('*').limit(1);
  if (error) console.error('❌ Supabase error:', error.message);
  else console.log('✅ Supabase connected. Example data:', data);
}

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabaseClient
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }

  return data || [];
}

export async function getAgent(id: string): Promise<Agent | null> {
  const { data, error } = await supabaseClient
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching agent:', error);
    throw error;
  }

  return data;
}

export async function createAgent(agent: Omit<Agent, 'id' | 'created_at'>): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .insert([agent])
    .select()
    .single();

  if (error) {
    console.error('Error creating agent:', error);
    throw error;
  }

  return data;
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent:', error);
    throw error;
  }

  return data;
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('agents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
} 