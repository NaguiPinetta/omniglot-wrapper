import { supabaseClient } from '../supabaseClient';
import type { Agent, AgentFormData, AgentResponse } from '../../types/agents';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getAgents({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Agent[]> {
	const { data, error } = await client.from('agents').select('*');
  if (error) throw error;
	return data ?? [];
}

export async function getAgent(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Agent> {
	const { data, error } = await client.from('agents').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
}

export async function createAgent(
	agent: Omit<Agent, 'id' | 'created_at'>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Agent> {
	console.log('createAgent API called with:', agent);
	const { data, error } = await client.from('agents').insert([agent]).select().single();
	console.log('createAgent API - data:', data);
	console.log('createAgent API - error:', error);
  if (error) throw error;
  return data;
}

export async function updateAgent(
	id: string,
	agent: Partial<Agent>,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<Agent> {
	const { data, error } = await client
		.from('agents')
		.update(agent)
		.eq('id', id)
		.select('*')
		.single();
	if (error) throw error;
	return data;
}

export async function deleteAgent(
	id: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<void> {
	const { error } = await client.from('agents').delete().eq('id', id);
  if (error) throw error;
}

// Commented out since is_active field doesn't exist in database
// export async function toggleAgentStatus(
// 	id: string,
// 	isActive: boolean,
// 	{ client = supabaseClient }: { client?: SupabaseClient } = {}
// ): Promise<Agent> {
// 	const { data, error } = await client
// 		.from('agents')
// 		.update({ is_active: isActive })
// 		.eq('id', id)
// 		.select()
// 		.single();

// 	if (error) throw error;
// 	return data;
// }

export async function executeAgent(
	agentId: string,
	input: string,
	{ client = supabaseClient }: { client?: SupabaseClient } = {}
): Promise<AgentResponse> {
  // First get the agent configuration
	const agent = await getAgent(agentId, { client });
  
	// Removed is_active check since field doesn't exist
	// if (!agent.is_active) {
	// 	throw new Error('Agent is not active');
	// }

  // Here you would typically make a call to your AI service (OpenAI, Anthropic, etc.)
  // For now, we'll simulate the response
  const response: AgentResponse = {
    id: crypto.randomUUID(),
    content: `Simulated response from ${agent.custom_name}: ${input}`,
    usage: {
      prompt_tokens: input.length,
      completion_tokens: 50,
      total_tokens: input.length + 50
    },
    model: agent.model,
    created_at: new Date().toISOString()
  };

  return response;
}

export async function testConnection({ client = supabaseClient }: { client?: SupabaseClient } = {}) {
	const { data, error } = await client.from('agents').select('*').limit(1);
  if (error) console.error('❌ Supabase error:', error.message);
  else console.log('✅ Supabase connected. Example data:', data);
} 