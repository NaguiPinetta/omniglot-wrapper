-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    key_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing models table and recreate with extended schema
DROP TABLE IF EXISTS models CASCADE;

CREATE TABLE models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  context_length INTEGER,
  input_cost_per_token DECIMAL(10,8),
  output_cost_per_token DECIMAL(10,8),
  is_active BOOLEAN DEFAULT true,
  
  -- New fields for access control
  access_type TEXT NOT NULL DEFAULT 'api_key' CHECK (access_type IN ('api_key', 'gateway', 'free', 'demo')),
  gateway_endpoint TEXT, -- URL for gateway/proxy models
  free_tier_limit INTEGER DEFAULT 0, -- Daily/monthly limit for free models
  requires_auth BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert models with different access types
INSERT INTO models (name, provider, description, context_length, input_cost_per_token, output_cost_per_token, access_type, free_tier_limit) VALUES
-- API Key Required Models
('gpt-3.5-turbo', 'openai', 'Fast, inexpensive model', 16385, 0.00000050, 0.00000150, 'api_key', 0),
('gpt-4', 'openai', 'High-intelligence flagship model', 8192, 0.00003000, 0.00006000, 'api_key', 0),
('gpt-4-turbo-preview', 'openai', 'Most capable GPT-4 model', 128000, 0.00001000, 0.00003000, 'api_key', 0),
('deepseek-chat', 'deepseek', 'General chat model', 32768, 0.00000014, 0.00000028, 'api_key', 0),
('deepseek-coder', 'deepseek', 'Code-focused model', 16384, 0.00000014, 0.00000028, 'api_key', 0),
('mistral-large-latest', 'mistral', 'Most capable Mistral model', 32768, 0.00000800, 0.00002400, 'api_key', 0),
('mistral-small-latest', 'mistral', 'Efficient small model', 32768, 0.00000200, 0.00000600, 'api_key', 0),

-- Free/Demo Models (no API key needed)
('llama-3.1-8b-free', 'meta', 'Free Llama model via gateway', 8192, 0, 0, 'free', 10),
('gemma-7b-free', 'google', 'Free Gemma model via gateway', 8192, 0, 0, 'free', 5),
('mixtral-8x7b-demo', 'mistral', 'Demo Mixtral model', 32768, 0, 0, 'demo', 3),

-- Gateway Models (via OpenRouter/Together)
('gpt-3.5-turbo-gateway', 'openai', 'GPT-3.5 via OpenRouter', 16385, 0.00000040, 0.00000120, 'gateway', 0),
('claude-3-haiku-gateway', 'anthropic', 'Claude 3 Haiku via gateway', 200000, 0.00000025, 0.00000125, 'gateway', 0);

-- Create indexes
CREATE INDEX idx_models_provider ON models(provider);
CREATE INDEX idx_models_access_type ON models(access_type);
CREATE INDEX idx_models_active ON models(is_active);

-- RLS Policies
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to models" ON models;
CREATE POLICY "Allow read access to models" 
ON models FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert access to models" ON models;
CREATE POLICY "Allow insert access to models" 
ON models FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to models" ON models;
CREATE POLICY "Allow update access to models" 
ON models FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow delete access to models" ON models;
CREATE POLICY "Allow delete access to models" 
ON models FOR DELETE 
USING (true);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY; 