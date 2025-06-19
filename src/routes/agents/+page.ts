import { getAgents } from '$lib/agents/api';
import type { Agent } from '../../../types/agents';

export const load = async () => {
  const agents: Agent[] = await getAgents();
  return { agents };
}; 