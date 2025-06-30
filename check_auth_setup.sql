-- Check Authentication Setup Status
-- Run this to verify if the main auth migration has been applied

-- 1. Check if users table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ Users table exists' 
    ELSE '❌ Users table missing - RUN complete_auth_migration.sql' 
  END as users_table_status;

-- 2. Check if auth trigger exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '✅ Auth trigger exists' 
    ELSE '❌ Auth trigger missing - RUN complete_auth_migration.sql' 
  END as auth_trigger_status;

-- 3. Check if handle_new_user function exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
    THEN '✅ User creation function exists' 
    ELSE '❌ User creation function missing - RUN complete_auth_migration.sql' 
  END as user_function_status;

-- 4. Check current RLS policies on key tables
SELECT 
  schemaname, 
  tablename, 
  policyname,
  CASE WHEN policyname LIKE '%anonymous%' THEN '⚠️ Still using anonymous policies' ELSE '✅ User-based policy' END as policy_status
FROM pg_policies 
WHERE tablename IN ('agents', 'datasets', 'jobs') 
ORDER BY tablename, policyname;

-- 5. Summary
SELECT '=== SUMMARY ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
    THEN '✅ AUTH SETUP COMPLETE - Magic links should work'
    ELSE '❌ AUTH SETUP INCOMPLETE - Run complete_auth_migration.sql first'
  END as overall_status; 