import { supabase as supabaseClient } from '../auth/client';
import type { Agent, AgentFormData, AgentResponse } from '../../types/agents';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createApiLogger } from '../utils/logger';

const logger = createApiLogger('AgentsAPI');

export async function getAgents({ client = supabaseClient }: { client?: SupabaseClient } = {}): Promise<Agent[]> {
	const { data, error } = await client.from('agents').select('*');
	
	if (error) {
		logger.error('Failed to get agents', error);
		throw error;
	}
	
	logger.debug(`Retrieved ${data?.length || 0} agents`);
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
	logger.debug('Creating agent', { name: agent.custom_name, model: agent.model });
	
	// Get current user ID
	const { data: { session } } = await client.auth.getSession();
	if (!session?.user?.id) {
		throw new Error('User not authenticated');
	}
	
	// Ensure user_id is set
	const agentWithUserId = {
		...agent,
		user_id: session.user.id
	};
	
	const { data, error } = await client.from('agents').insert([agentWithUserId]).select().single();
	
	if (error) {
		logger.error('Failed to create agent', error);
		throw error;
	}
	
	logger.info('Agent created successfully', { id: data.id, name: data.custom_name });
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
  if (error) logger.error('Supabase connection test failed', error);
  else logger.info('Supabase connection test successful', { sampleCount: data?.length || 0 });
} 