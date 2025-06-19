import { supabaseClient } from '../supabaseClient';
import type { Agent, AgentFormData, AgentResponse } from '../../types/agents';

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabaseClient
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAgent(id: string): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAgent(formData: AgentFormData): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .insert([{
      ...formData,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAgent(id: string, updates: Partial<AgentFormData>): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabaseClient
    .from('agents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleAgentStatus(id: string, isActive: boolean): Promise<Agent> {
  const { data, error } = await supabaseClient
    .from('agents')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function executeAgent(agentId: string, input: string): Promise<AgentResponse> {
  // First get the agent configuration
  const agent = await getAgent(agentId);
  
  if (!agent.is_active) {
    throw new Error('Agent is not active');
  }

  // Here you would typically make a call to your AI service (OpenAI, Anthropic, etc.)
  // For now, we'll simulate the response
  const response: AgentResponse = {
    id: crypto.randomUUID(),
    content: `Simulated response from ${agent.name}: ${input}`,
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

export async function testConnection() {
  const { data, error } = await supabaseClient.from('agents').select('*').limit(1);
  if (error) console.error('❌ Supabase error:', error.message);
  else console.log('✅ Supabase connected. Example data:', data);
} 