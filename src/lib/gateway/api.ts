import type { Model } from '../../types/models';

// Gateway configuration - will be passed from server-side
export interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
}

// Default gateway configurations (without API keys)
const DEFAULT_GATEWAY_CONFIGS = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Omniglot Wrapper'
    }
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    headers: {}
  },
  custom: {
    baseUrl: 'http://localhost:8000',
    headers: {}
  }
};

export interface GatewayRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface GatewayResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// Determine which gateway to use based on model
function getGatewayConfig(model: Model, gatewayConfigs: Record<string, GatewayConfig>): GatewayConfig {
  // Custom gateway endpoints
  if (model.gateway_endpoint) {
    return gatewayConfigs.custom || {
      baseUrl: model.gateway_endpoint,
      apiKey: '',
      headers: {}
    };
  }
  
  // Provider-specific gateways
  switch (model.provider) {
    case 'meta':
    case 'google':
      return gatewayConfigs.together || { ...DEFAULT_GATEWAY_CONFIGS.together, apiKey: '' };
    case 'anthropic':
      return gatewayConfigs.openrouter || { ...DEFAULT_GATEWAY_CONFIGS.openrouter, apiKey: '' };
    default:
      return gatewayConfigs.openrouter || { ...DEFAULT_GATEWAY_CONFIGS.openrouter, apiKey: '' };
  }
}

// Make request to gateway
export async function callGatewayModel(
  model: Model,
  request: GatewayRequest,
  gatewayConfigs: Record<string, GatewayConfig> = {},
  fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<GatewayResponse> {
  const config = getGatewayConfig(model, gatewayConfigs);
  
  if (!config.apiKey) {
    throw new Error(`No API key configured for gateway: ${model.provider}`);
  }
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.headers
    },
    body: JSON.stringify({
      ...request,
      model: model.name
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gateway request failed: ${response.status} ${error}`);
  }
  
  return response.json();
}

// Free tier mock responses for demo models
const DEMO_RESPONSES = {
  'mixtral-8x7b-demo': {
    id: 'demo-' + Date.now(),
    choices: [{
      message: {
        role: 'assistant',
        content: '🎯 This is a demo response from Mixtral 8x7B. In a real implementation, this would connect to the actual model via gateway.'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 20,
      completion_tokens: 25,
      total_tokens: 45
    },
    model: 'mixtral-8x7b-demo'
  },
  'llama-3.1-8b-free': {
    id: 'free-' + Date.now(),
    choices: [{
      message: {
        role: 'assistant',
        content: '🆓 This is a free tier response from Llama 3.1 8B. You have limited daily usage for this model.'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 18,
      completion_tokens: 22,
      total_tokens: 40
    },
    model: 'llama-3.1-8b-free'
  },
  'gemma-7b-free': {
    id: 'free-' + Date.now(),
    choices: [{
      message: {
        role: 'assistant',
        content: '🆓 This is a free tier response from Gemma 7B. Limited daily usage applies.'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 16,
      completion_tokens: 18,
      total_tokens: 34
    },
    model: 'gemma-7b-free'
  }
};

// Handle free/demo model requests with mock responses
export async function callFreeModel(
  model: Model,
  request: GatewayRequest
): Promise<GatewayResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const demoResponse = DEMO_RESPONSES[model.name as keyof typeof DEMO_RESPONSES];
  if (!demoResponse) {
    throw new Error(`No demo response configured for model: ${model.name}`);
  }
  
  // Customize response based on request
  const customResponse = {
    ...demoResponse,
    id: `${model.access_type}-${Date.now()}`,
    choices: [{
      ...demoResponse.choices[0],
      message: {
        ...demoResponse.choices[0].message,
        content: `${demoResponse.choices[0].message.content}\n\nYour request: "${request.messages[request.messages.length - 1]?.content}"`
      }
    }]
  };
  
  return customResponse;
}

// Main function to route requests based on access type
export async function callModel(
  model: Model,
  request: GatewayRequest,
  fetch: typeof globalThis.fetch = globalThis.fetch
): Promise<GatewayResponse> {
  switch (model.access_type) {
    case 'free':
    case 'demo':
      return callFreeModel(model, request);
    case 'gateway':
      return callGatewayModel(model, request, {}, fetch);
    case 'api_key':
      throw new Error('API key models should be handled by direct provider APIs');
    default:
      throw new Error(`Unknown access type: ${model.access_type}`);
  }
} 