-- Usage Tracking Table for Free Tier Models
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
CREATE INDEX idx_usage_tracking_model_date ON usage_tracking(model_id, usage_date);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);
CREATE INDEX idx_usage_tracking_agent ON usage_tracking(agent_id);

-- RLS Policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

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

-- Function to check if user has exceeded free tier limit
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

-- Function to increment usage count
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