-- Step 1: Check what API keys actually exist
SELECT id, provider, LEFT(key_value, 10) || '...' as key_preview, is_active
FROM public.api_keys 
WHERE provider = 'openai'
ORDER BY created_at;

-- Step 2: Check what the existing working models are using
SELECT DISTINCT api_key_id, COUNT(*) as model_count
FROM public.models 
WHERE provider = 'openai' 
GROUP BY api_key_id;

-- Step 3: Use the same API key that existing models use
UPDATE public.models 
SET api_key_id = (
    SELECT api_key_id 
    FROM public.models 
    WHERE provider = 'openai' 
    AND name = 'gpt-4'
    LIMIT 1
)
WHERE name IN ('gpt-4o', 'gpt-4o-mini');

-- Step 4: Verify all models now have valid API key references
SELECT 
    m.name, 
    m.api_key_id,
    CASE 
        WHEN ak.id IS NOT NULL THEN 'Valid ✅'
        ELSE 'Invalid ❌'
    END as key_status
FROM public.models m
LEFT JOIN public.api_keys ak ON m.api_key_id = ak.id
WHERE m.provider = 'openai' 
ORDER BY m.name;
