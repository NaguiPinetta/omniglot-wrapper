export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'translator' | 'reviewer' | 'custom';
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentFormData {
  name: string;
  description: string;
  type: Agent['type'];
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  user_prompt_template: string;
}

export interface AgentStore {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

export interface AgentResponse {
  id: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created_at: string;
} 