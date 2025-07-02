-- Fix User Authentication Issues
-- This script addresses the mismatch between auth.users and public.users

-- STEP 1: Check current state
SELECT 'Current Auth Users:' as info;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

SELECT 'Current Publi Users:' as info;
SELECT id, email, name, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- STEP 2: Create proper user profiles for authenticated users
-- This will match auth.users with public.users using the correct IDs

DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Loop through all confirmed auth users
    FOR auth_user IN 
        SELECT id, email, raw_user_meta_data, created_at 
        FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        -- Insert or update user profile with correct auth ID
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
            updated_at = NOW();
            
        RAISE NOTICE 'Synced user profile for: %', auth_user.email;
    END LOOP;
END $$;

-- STEP 3: Clean up any orphaned public.users records that don't match auth.users
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- STEP 4: Ensure the trigger function works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with matching auth ID
    INSERT INTO public.users (id, email, name, created_at)
    VALUES (
        NEW.id,  -- This must match the auth.users.id
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = NOW();
        
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block auth
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Fix RLS policies to allow proper user creation
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
CREATE POLICY "Allow user creation" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 7: Verification
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count,
    array_agg(email ORDER BY email) as emails
FROM auth.users
WHERE email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
    'Public Users' as table_name,
    COUNT(*) as count,
    array_agg(email ORDER BY email) as emails
FROM public.users;

-- STEP 8: Check for any mismatched IDs
SELECT 'ID MISMATCH CHECK:' as info;
SELECT 
    au.email as auth_email,
    pu.email as public_email,
    au.id as auth_id,
    pu.id as public_id,
    CASE 
        WHEN au.id = pu.id THEN 'MATCH' 
        ELSE 'MISMATCH' 
    END as status
FROM auth.users au
FULL OUTER JOIN public.users pu ON au.email = pu.email
WHERE au.email_confirmed_at IS NOT NULL;

SELECT 'Authentication fix completed!' as status;
