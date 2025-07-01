-- Manually add GPT-4o model
-- This adds GPT-4o directly to the models table

INSERT INTO public.models (
    name,
    provider,
    description,
    context_length,
    input_cost_per_token,
    output_cost_per_token,
    is_active,
    access_type,
    free_tier_limit,
    requires_auth,
    api_key_id
) VALUES (
    'gpt-4o',
    'openai',
    'OpenAI GPT-4o - Most advanced multimodal model',
    128000,
    0.000005,
    0.000015,
    true,
    'api_key',
    0,
    true,
    (SELECT id FROM public.api_keys WHERE provider = 'openai' LIMIT 1)
);

-- Also add GPT-4o-mini for cost-effective option
INSERT INTO public.models (
    name,
    provider,
    description,
    context_length,
    input_cost_per_token,
    output_cost_per_token,
    is_active,
    access_type,
    free_tier_limit,
    requires_auth,
    api_key_id
) VALUES (
    'gpt-4o-mini',
    'openai',
    'OpenAI GPT-4o Mini - Fast and cost-effective',
    128000,
    0.00000015,
    0.0000006,
    true,
    'api_key',
    0,
    true,
    (SELECT id FROM public.api_keys WHERE provider = 'openai' LIMIT 1)
);

-- Verify the models were added
SELECT 
    name,
    provider,
    context_length,
    is_active,
    access_type
FROM public.models 
WHERE provider = 'openai' 
ORDER BY name;
