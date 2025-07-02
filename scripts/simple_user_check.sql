-- Simple User State Check
-- Run this first to understand the current situation

-- Check authenticated users in auth.users
SELECT 'AUTHENTICATED USERS IN AUTH.USERS:' as section;
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
ORDER BY email;

-- Check users in public.users
SELECT 'USERS IN PUBLIC.USERS:' as section;
SELECT 
    id,
    email,
    name,
    created_at
FROM public.users
ORDER BY email;

-- Find email duplicates in public.users
SELECT 'EMAIL DUPLICATES IN PUBLIC.USERS:' as section;
SELECT 
    email,
    COUNT(*) as duplicate_count,
    array_agg(id) as all_ids
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check for ID/email mismatches
SELECT 'AUTH vs PUBLIC USER COMPARISON:' as section;
SELECT 
    COALESCE(au.email, pu.email) as email,
    au.id as auth_id,
    pu.id as public_id,
    CASE 
        WHEN au.id IS NULL THEN 'MISSING_FROM_AUTH'
        WHEN pu.id IS NULL THEN 'MISSING_FROM_PUBLIC'
        WHEN au.id = pu.id THEN 'MATCH'
        ELSE 'ID_MISMATCH'
    END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email_confirmed_at IS NOT NULL OR pu.email IS NOT NULL
ORDER BY email;
