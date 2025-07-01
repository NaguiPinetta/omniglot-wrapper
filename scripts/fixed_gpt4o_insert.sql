-- Fixed GPT-4o insertion with correct access_type
-- First, let's check what access_type values are allowed
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%access_type%';

-- Then insert GPT-4o with the correct access_type value
INSERT INTO public.models (
    name, provider, description, context_length,
    input_cost_per_token, output_cost_per_token, is_active,
    access_type, api_key_id
) VALUES (
    'gpt-4o', 'openai', 'GPT-4o - Latest OpenAI model', 128000,
    0.000005, 0.000015, true, 'api_key',
    '0c31840d-c606-44a9-b675-6cc7c6bdafcf'
);

-- Add GPT-4o-mini as well
INSERT INTO public.models (
    name, provider, description, context_length,
    input_cost_per_token, output_cost_per_token, is_active,
    access_type, api_key_id
) VALUES (
    'gpt-4o-mini', 'openai', 'GPT-4o Mini - Fast and efficient', 128000,
    0.00000015, 0.0000006, true, 'api_key',
    '0c31840d-c606-44a9-b675-6cc7c6bdafcf'
);
