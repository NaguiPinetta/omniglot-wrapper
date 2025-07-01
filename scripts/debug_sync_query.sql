-- Debug: Test the exact query the sync endpoint uses
-- This will show us what the sync endpoint should find

SELECT 
    id,
    provider,
    LEFT(key_value, 10) || '...' as key_preview,
    is_active,
    created_at
FROM public.api_keys 
WHERE provider = 'openai' 
AND is_active = true
LIMIT 1;

-- Also check what models already exist
SELECT 
    name,
    provider,
    is_active,
    api_key_id
FROM public.models 
WHERE provider = 'openai'
ORDER BY name;
