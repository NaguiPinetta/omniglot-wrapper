-- Debug script to check current agents table state

-- Check all agents with their actual field values
SELECT 
    id,
    custom_name,
    CASE 
        WHEN custom_name IS NULL THEN 'NULL'
        WHEN custom_name = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE: ' || custom_name
    END as custom_name_status,
    model,
    model_provider,
    temperature,
    top_p,
    created_at
FROM agents 
ORDER BY created_at DESC;

-- Count agents by custom_name status
SELECT 
    CASE 
        WHEN custom_name IS NULL THEN 'NULL'
        WHEN custom_name = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END as status,
    COUNT(*) as count
FROM agents 
GROUP BY 
    CASE 
        WHEN custom_name IS NULL THEN 'NULL'
        WHEN custom_name = '' THEN 'EMPTY'
        ELSE 'HAS_VALUE'
    END;

-- Fix any remaining NULL or empty custom_name values
UPDATE agents 
SET custom_name = 'Agent ' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE custom_name IS NULL OR custom_name = '';

-- Show final state
SELECT id, custom_name, model, created_at FROM agents ORDER BY created_at; 