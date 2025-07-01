-- Comprehensive schema update for Omniglot Wrapper
-- Run this in your Supabase SQL editor

-- 1. First, add name column to agents table if it doesn't exist
DO $$ 
BEGIN
    -- Check if name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'name'
    ) THEN
        ALTER TABLE agents ADD COLUMN name TEXT;
        
        -- Update existing agents that might not have names
        UPDATE agents 
        SET name = COALESCE(name, 'Agent ' || substr(id::text, 1, 8))
        WHERE name IS NULL OR name = '';
        
        -- Make name column NOT NULL
        ALTER TABLE agents ALTER COLUMN name SET NOT NULL;
        
        -- Add default value for future inserts
        ALTER TABLE agents ALTER COLUMN name SET DEFAULT 'New Agent';
    END IF;
END $$;

-- 2. Update models table to add access_type and related fields
DO $$
BEGIN
    -- Add access_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'access_type'
    ) THEN
        ALTER TABLE models ADD COLUMN access_type TEXT DEFAULT 'api_key' 
        CHECK (access_type IN ('api_key', 'gateway', 'free', 'demo'));
    END IF;
    
    -- Add other new columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'gateway_endpoint'
    ) THEN
        ALTER TABLE models ADD COLUMN gateway_endpoint TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'free_tier_limit'
    ) THEN
        ALTER TABLE models ADD COLUMN free_tier_limit INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'requires_auth'
    ) THEN
        ALTER TABLE models ADD COLUMN requires_auth BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Update existing models to set access_type
UPDATE models SET access_type = 'api_key' WHERE access_type IS NULL;

-- 4. Add some free/demo models for testing
INSERT INTO models (name, provider, description, context_length, input_cost_per_token, output_cost_per_token, access_type, free_tier_limit, is_active) VALUES
-- Free tier models
('llama-3.1-8b-free', 'meta', 'Free Llama model via gateway', 8192, 0, 0, 'free', 10, true),
('gemma-7b-free', 'google', 'Free Gemma model via gateway', 8192, 0, 0, 'free', 5, true),

-- Demo models  
('mixtral-8x7b-demo', 'mistral', 'Demo Mixtral model', 32768, 0, 0, 'demo', 3, true),

-- Gateway models
('gpt-3.5-turbo-gateway', 'openai', 'GPT-3.5 via OpenRouter', 16385, 0.00000040, 0.00000120, 'gateway', 0, true),
('claude-3-haiku-gateway', 'anthropic', 'Claude 3 Haiku via gateway', 200000, 0.00000025, 0.00000125, 'gateway', 0, true)

ON CONFLICT (name, provider) DO NOTHING;

-- 5. Create usage tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  user_id TEXT, -- For future user system, can be session ID for now
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Usage metrics
  requests_count INTEGER DEFAULT 1,
  tokens_used INTEGER DEFAULT 0,
  usage_date DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user/model/date
  UNIQUE(model_id, user_id, usage_date)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_model_date ON usage_tracking(model_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_agent ON usage_tracking(agent_id);

-- Enable RLS on usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage_tracking
DROP POLICY IF EXISTS "Allow read access to usage_tracking" ON usage_tracking;
CREATE POLICY "Allow read access to usage_tracking" 
ON usage_tracking FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert access to usage_tracking" ON usage_tracking;
CREATE POLICY "Allow insert access to usage_tracking" 
ON usage_tracking FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to usage_tracking" ON usage_tracking;
CREATE POLICY "Allow update access to usage_tracking" 
ON usage_tracking FOR UPDATE 
USING (true);

-- 6. Create usage tracking functions
CREATE OR REPLACE FUNCTION check_free_tier_limit(
  p_model_id UUID,
  p_user_id TEXT,
  p_usage_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
DECLARE
  model_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get the model's free tier limit
  SELECT free_tier_limit INTO model_limit 
  FROM models 
  WHERE id = p_model_id AND access_type IN ('free', 'demo');
  
  -- If no limit or not a free model, allow unlimited usage
  IF model_limit IS NULL OR model_limit = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Get current usage for today
  SELECT COALESCE(SUM(requests_count), 0) INTO current_usage
  FROM usage_tracking
  WHERE model_id = p_model_id 
    AND user_id = p_user_id 
    AND usage_date = p_usage_date;
  
  -- Check if under limit
  RETURN current_usage < model_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_usage(
  p_model_id UUID,
  p_user_id TEXT,
  p_agent_id UUID DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert or update usage record
  INSERT INTO usage_tracking (model_id, user_id, agent_id, requests_count, tokens_used)
  VALUES (p_model_id, p_user_id, p_agent_id, 1, p_tokens_used)
  ON CONFLICT (model_id, user_id, usage_date)
  DO UPDATE SET 
    requests_count = usage_tracking.requests_count + 1,
    tokens_used = usage_tracking.tokens_used + p_tokens_used,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Done! Your database is now updated with all the new features. 