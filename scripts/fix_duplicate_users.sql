-- Fix Duplicate User Issues
-- This handles the duplicate email constraint error

-- STEP 1: Check current state
SELECT 'Current Auth Users:' as info;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC;

SELECT 'Current Public Users:' as info;
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- STEP 2: Find duplicates and mismatches
SELECT 'DUPLICATE EMAIL CHECK:' as info;
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as user_ids
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- STEP 3: Clean up duplicate/incorrect public users
-- Keep only the users that match auth.users IDs
DELETE FROM public.users 
WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- STEP 4: Now safely sync auth users to public users
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN 
        SELECT id, email, raw_user_meta_data, created_at 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        -- Use UPSERT to handle any remaining conflicts
        INSERT INTO public.users (id, email, name, created_at)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(
                auth_user.raw_user_meta_data->>'name',
                split_part(auth_user.email, '@', 1)
            ),
            auth_user.created_at
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, users.name),
            updated_at = NOW()
        ON CONFLICT (email) DO UPDATE SET
            id = EXCLUDED.id,
            name = COALESCE(EXCLUDED.name, users.name),
            updated_at = NOW();
            
        RAISE NOTICE 'Synced user: % (ID: %)', auth_user.email, auth_user.id;
    END LOOP;
END $$;

-- STEP 5: Final verification
SELECT 'FINAL STATE:' as info;
SELECT 
    'Auth Users' as source,
    COUNT(*) as count,
    array_agg(email ORDER BY email) as emails
FROM auth.users
WHERE email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
    'Public Users' as source,
    COUNT(*) as count,
    array_agg(email ORDER BY email) as emails
FROM public.users;

-- STEP 6: Verify ID matching
SELECT 'ID VERIFICATION:' as info;
SELECT 
    au.email,
    au.id as auth_id,
    pu.id as public_id,
    CASE WHEN au.id = pu.id THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.email;

SELECT 'Duplicate user fix completed!' as status; 