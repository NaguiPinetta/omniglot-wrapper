-- Manual Data Ownership Migration
-- Run this in the Supabase SQL Editor

-- First, let's see what user UUID we need to migrate to
-- This should show the real user UUID from the api_keys table
SELECT DISTINCT user_id, 'api_keys' as source 
FROM api_keys 
WHERE user_id != '00000000-0000-0000-0000-000000000000';

-- Check current data ownership
SELECT 
    'agents' as table_name,
    user_id,
    COUNT(*) as count
FROM agents 
GROUP BY user_id
UNION ALL
SELECT 
    'jobs' as table_name,
    user_id,
    COUNT(*) as count
FROM jobs 
GROUP BY user_id
UNION ALL
SELECT 
    'datasets' as table_name,
    user_id,
    COUNT(*) as count
FROM datasets 
GROUP BY user_id;

-- Get the real user UUID (replace this with the actual UUID from the first query above)
-- Based on the schema, it should be something like: f2efaddd-845d-45ff-a787-2dd171d4518b

-- Update agents ownership
UPDATE agents 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Update jobs ownership  
UPDATE jobs 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Update datasets ownership
UPDATE datasets 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Update glossary ownership
UPDATE glossary 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Update translations ownership
UPDATE translations 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Update usage_tracking ownership
UPDATE usage_tracking 
SET user_id = (SELECT DISTINCT user_id FROM api_keys WHERE user_id != '00000000-0000-0000-0000-000000000000' LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Verify the migration
SELECT 
    'agents' as table_name,
    user_id,
    COUNT(*) as count
FROM agents 
GROUP BY user_id
UNION ALL
SELECT 
    'jobs' as table_name,
    user_id,
    COUNT(*) as count
FROM jobs 
GROUP BY user_id
UNION ALL
SELECT 
    'datasets' as table_name,
    user_id,
    COUNT(*) as count
FROM datasets 
GROUP BY user_id;

-- Final check - should show 0 for anonymous data
SELECT 
    COUNT(*) as remaining_anonymous_agents
FROM agents 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

SELECT 
    COUNT(*) as remaining_anonymous_jobs
FROM jobs 
WHERE user_id = '00000000-0000-0000-0000-000000000000'; 