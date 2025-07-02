-- Debug Authentication Issues
-- Run this to understand the current state

-- Check auth users
SELECT 'AUTH USERS:' as table_type;
SELECT 
    id, 
    email, 
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Check public users  
SELECT 'PUBLIC USERS:' as table_type;
SELECT 
    id,
    email,
    name,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Check for ID mismatches
SELECT 'ID MATCHING:' as check_type;
SELECT 
    au.email,
    au.id as auth_id,
    pu.id as public_id,
    CASE 
        WHEN au.id = pu.id THEN 'MATCH'
        WHEN pu.id IS NULL THEN 'MISSING_PUBLIC'
        WHEN au.id IS NULL THEN 'MISSING_AUTH' 
        ELSE 'MISMATCH'
    END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email_confirmed_at IS NOT NULL OR pu.email IS NOT NULL;

-- Check RLS policies
SELECT 'RLS POLICIES:' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
