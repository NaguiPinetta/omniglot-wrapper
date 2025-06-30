-- Quick Migration Verification
-- Run this to see if the data migration worked

-- 1. Check current auth state
SELECT 'CURRENT AUTH STATUS' as check_type;
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email,
  auth.role() as current_role;

-- 2. Check if user profile exists
SELECT 'USER PROFILE CHECK' as check_type;
SELECT 
  id,
  email,
  name,
  created_at
FROM public.users 
WHERE email = 'jpinetta@gmail.com';

-- 3. Check data ownership after migration
SELECT 'DATA OWNERSHIP AFTER MIGRATION' as check_type;
SELECT 
  'jobs' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_records,
  COUNT(CASE WHEN user_id != '00000000-0000-0000-0000-000000000000' THEN 1 END) as user_owned_records
FROM jobs
UNION ALL
SELECT 
  'datasets' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_records,
  COUNT(CASE WHEN user_id != '00000000-0000-0000-0000-000000000000' THEN 1 END) as user_owned_records
FROM datasets
UNION ALL
SELECT 
  'agents' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN user_id = '00000000-0000-0000-0000-000000000000' THEN 1 END) as anonymous_records,
  COUNT(CASE WHEN user_id != '00000000-0000-0000-0000-000000000000' THEN 1 END) as user_owned_records
FROM agents;

-- 4. Test if current user can see their data
SELECT 'RLS ACCESS TEST' as check_type;
SELECT 
  COUNT(*) as accessible_jobs
FROM jobs 
WHERE user_id = CAST(auth.uid() AS TEXT);

SELECT 'Migration verification complete!' as status; 