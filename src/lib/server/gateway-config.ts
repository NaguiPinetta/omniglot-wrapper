import type { GatewayConfig } from '../gateway/api';

// Server-side gateway configuration with environment variables
export function getServerGatewayConfigs(): Record<string, GatewayConfig> {
  return {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      headers: {
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5173',
        'X-Title': 'Omniglot Wrapper'
      }
    },
    together: {
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY || '',
      headers: {}
    },
    custom: {
      baseUrl: process.env.CUSTOM_GATEWAY_URL || 'http://localhost:8000',
      apiKey: process.env.CUSTOM_GATEWAY_KEY || '',
      headers: {}
    }
  };
} 