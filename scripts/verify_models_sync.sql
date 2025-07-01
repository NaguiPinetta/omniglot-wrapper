-- Verify OpenAI Models Sync
-- This script checks the state of API keys and models tables

-- 1. Check for OpenAI API keys
SELECT 
    'API Keys Check' as check_type,
    COUNT(*) as count,
    STRING_AGG(provider, ', ') as providers
FROM api_keys 
WHERE provider = 'openai' AND is_active = true;

-- 2. Check existing OpenAI models
SELECT 
    'Models Check' as check_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT name, ', ') as model_names
FROM models 
WHERE provider = 'openai';

-- 3. Detailed models view
SELECT 
    name,
    provider,
    context_length,
    is_active,
    created_at
FROM models 
WHERE provider = 'openai'
ORDER BY name;

-- 4. Check if we have both API keys and models
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM api_keys WHERE provider = 'openai' AND is_active = true) > 0 
             AND (SELECT COUNT(*) FROM models WHERE provider = 'openai') > 0
        THEN 'Ready for sync test'
        WHEN (SELECT COUNT(*) FROM api_keys WHERE provider = 'openai' AND is_active = true) = 0
        THEN 'Missing OpenAI API key'
        ELSE 'API key exists, no models yet'
    END as sync_status; 