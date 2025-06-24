-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    key_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create models table
CREATE TABLE IF NOT EXISTS public.models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT,
    context_length INTEGER,
    input_cost_per_token DECIMAL(10,8),
    output_cost_per_token DECIMAL(10,8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, provider)
);

-- Insert some default models
INSERT INTO public.models (name, provider, description, context_length, input_cost_per_token, output_cost_per_token) VALUES
-- OpenAI Models
('gpt-4-turbo-preview', 'openai', 'Most capable GPT-4 model', 128000, 0.00001, 0.00003),
('gpt-4', 'openai', 'High-intelligence flagship model', 8192, 0.00003, 0.00006),
('gpt-3.5-turbo', 'openai', 'Fast, inexpensive model', 16385, 0.0000005, 0.0000015),

-- DeepSeek Models
('deepseek-coder', 'deepseek', 'Code-focused model', 16384, 0.00000014, 0.00000028),
('deepseek-chat', 'deepseek', 'General chat model', 32768, 0.00000014, 0.00000028),

-- Mistral Models
('mistral-large-latest', 'mistral', 'Most capable Mistral model', 32768, 0.000008, 0.000024),
('mistral-small-latest', 'mistral', 'Efficient small model', 32768, 0.000002, 0.000006)

ON CONFLICT (name, provider) DO NOTHING;

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Create policies for api_keys (allow all operations for now)
CREATE POLICY "Allow all operations on api_keys" ON public.api_keys
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for models (allow all operations for now)
CREATE POLICY "Allow all operations on models" ON public.models
    FOR ALL USING (true) WITH CHECK (true); 