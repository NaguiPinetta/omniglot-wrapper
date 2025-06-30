-- Debug script to check user session and data association
-- Check current user profiles
SELECT 'User Profiles:' as debug_section;
SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC;

-- Check agents data
SELECT 'Agents Data:' as debug_section;
SELECT id, custom_name, user_id, created_at FROM agents ORDER BY created_at DESC LIMIT 10;

-- Check jobs data  
SELECT 'Jobs Data:' as debug_section;
SELECT id, name, user_id, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 10;

-- Check datasets data
SELECT 'Datasets Data:' as debug_section;
SELECT id, name, user_id, created_at FROM datasets ORDER BY created_at DESC LIMIT 10;

-- Check for any data still associated with anonymous user
SELECT 'Anonymous Data Check:' as debug_section;
SELECT 
  'agents' as table_name, 
  COUNT(*) as count 
FROM agents 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 
  'jobs' as table_name, 
  COUNT(*) as count 
FROM jobs 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
UNION ALL
SELECT 
  'datasets' as table_name, 
  COUNT(*) as count 
FROM datasets 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Check RLS policy status
SELECT 'RLS Status:' as debug_section;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'agents', 'jobs', 'datasets', 'glossary', 'modules'); 