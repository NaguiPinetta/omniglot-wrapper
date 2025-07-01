-- Check current database schema
-- This script checks the current structure of api_keys and models tables

-- Check api_keys table structure
SELECT 
    'api_keys' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- Check models table structure
SELECT 
    'models' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'models'
ORDER BY ordinal_position;

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('api_keys', 'models');

-- Check current data in api_keys
SELECT 
    id,
    provider,
    LEFT(key_value, 10) || '...' as key_preview,
    created_at
FROM public.api_keys
LIMIT 5; 