-- Comprehensive User Authentication Diagnosis
-- Run this to check the current state

-- 1. Check if users table exists and has data
SELECT 'USERS TABLE CHECK' as check_type;
SELECT 
  COUNT(*) as total_users,
  array_agg(email) as user_emails
FROM public.users;

-- 2. Check if auth.users has data
SELECT 'AUTH USERS CHECK' as check_type;
SELECT 
  COUNT(*) as total_auth_users,
  array_agg(email) as auth_emails
FROM auth.users;

-- 3. Check RLS policies on users table
SELECT 'USERS RLS POLICIES' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Check RLS policies on main tables
SELECT 'MAIN TABLES RLS POLICIES' as check_type;
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('jobs', 'datasets', 'agents', 'models')
ORDER BY tablename, policyname;

-- 5. Check if trigger exists
SELECT 'TRIGGER CHECK' as check_type;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Check function exists
SELECT 'FUNCTION CHECK' as check_type;
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 7. Test current auth state (this will show what auth.uid() returns)
SELECT 'CURRENT AUTH STATE' as check_type;
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 8. Check sample data in main tables
SELECT 'SAMPLE DATA CHECK' as check_type;
SELECT 
  'jobs' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM jobs
UNION ALL
SELECT 
  'datasets' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM datasets
UNION ALL
SELECT 
  'agents' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT user_id) as user_ids
FROM agents; 