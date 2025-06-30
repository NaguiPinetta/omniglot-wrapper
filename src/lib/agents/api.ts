import { supabase as supabaseClient } from '../auth/client';
import type { Agent, AgentFormData, AgentResponse } from '../../types/agents';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getAgents({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Agent[]> {
	console.log('=== AGENTS API DEBUG START ===');
	console.log('Client type:', client === supabaseClient ? 'supabaseClient' : 'server client');
	
	// Check current user/session
	const { data: { user }, error: userError } = await client.auth.getUser();
	console.log('Current user:', user?.email || 'No user');
	console.log('User error:', userError);
	
	const { data: { session }, error: sessionError } = await client.auth.getSession();
	console.log('Current session:', !!session);
	console.log('Session error:', sessionError);
	
	// Try to get agents
	const { data, error } = await client.from('agents').select('*');
	console.log('Agents query result - data:', data);
	console.log('Agents query result - error:', error);
	console.log('Agents count:', data?.length || 0);
	
	if (error) {
		console.log('=== AGENTS API DEBUG END (ERROR) ===');
		throw error;
	}
	
	console.log('=== AGENTS API DEBUG END ===');
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
	options: { client?: SupabaseClient, messages?: { role: string, content: string }[] }
): Promise<AgentResponse> {
  // First get the agent configuration
  const agent = await getAgent(agentId, { client: options.client });
  
  // Prepare messages array
  const messages = options.messages || [
    { role: 'system', content: agent.prompt },
    { role: 'user', content: input }
  ];

  // Add timeout logic (30 seconds)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s

  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: agent.model, messages }),
      signal: controller.signal
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Agent execution timed out after 30 seconds');
    }
    if (err instanceof Error) {
      throw new Error(`Agent execution failed: ${err.message}`);
    }
    throw new Error('Agent execution failed: Unknown error');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`Agent execution failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Expecting data to match OpenAI/LLM API response shape
  // Normalize to AgentResponse
  return {
    id: data.id ?? crypto.randomUUID(),
    content: data.choices?.[0]?.message?.content || data.content || '',
    usage: data.usage || {},
    model: agent.model,
    created_at: new Date().toISOString()
  };
}

export async function testConnection({ client = supabaseClient }: { client?: SupabaseClient } = {}) {
	const { data, error } = await client.from('agents').select('*').limit(1);
  if (error) console.error('❌ Supabase error:', error.message);
  else console.log('✅ Supabase connected. Example data:', data);
} 