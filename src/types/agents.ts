export type Agent = {
  id: string;
  custom_name: string;
  model: string;
  model_provider: 'openai' | 'deepseek' | 'mistral' | 'custom';
  prompt: string;
  temperature?: number;
  top_p?: number;
  created_at: string;
  model_id: string;
};

export interface AgentFormData {
  custom_name: string;
  model: string;
  model_provider: Agent['model_provider'];
  prompt: string;
  temperature?: number;
  top_p?: number;
  model_id: string;
}

export interface AgentStore {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

export type AgentResponse = {
  id: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created_at: string;
}; 