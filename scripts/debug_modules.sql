-- Debug modules table and RLS policies
-- Run this in Supabase SQL Editor

-- Check if modules table exists and has data
SELECT 'Modules table structure:' as info;
\d modules;

-- Check current modules
SELECT 'Current modules:' as info;
SELECT * FROM modules ORDER BY name;

-- Check RLS policies on modules table
SELECT 'RLS policies on modules:' as info;
SELECT policyname, command, roles, using_expression, with_check_expression
FROM pg_policies
WHERE tablename = 'modules';

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename = 'modules';

-- Check current user context
SELECT 'Current user context:' as info;
SELECT 
  auth.uid() as auth_uid,
  auth.role() as auth_role,
  current_user as current_user;

-- Test if user can access modules
SELECT 'User access test:' as info;
SELECT COUNT(*) as module_count FROM modules;

-- Check if user has any modules
SELECT 'User-specific modules:' as info;
SELECT * FROM modules WHERE user_id = auth.uid();

-- If modules table has user_id column, check data ownership
SELECT 'Module ownership analysis:' as info;
SELECT 
  user_id,
  COUNT(*) as module_count
FROM modules
GROUP BY user_id; 