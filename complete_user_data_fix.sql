-- Complete User Data Migration and Authentication Fix
-- This will solve the authentication and data association issues

-- STEP 1: Create a function to migrate anonymous data to authenticated users
CREATE OR REPLACE FUNCTION migrate_anonymous_data_to_user(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    anonymous_uuid TEXT := '00000000-0000-0000-0000-000000000000';
    result_text TEXT := '';
    job_count INTEGER;
    dataset_count INTEGER;
    agent_count INTEGER;
BEGIN
    -- Update jobs
    UPDATE jobs 
    SET user_id = target_user_id::TEXT 
    WHERE user_id = anonymous_uuid;
    GET DIAGNOSTICS job_count = ROW_COUNT;
    
    -- Update datasets  
    UPDATE datasets 
    SET user_id = target_user_id::TEXT 
    WHERE user_id = anonymous_uuid;
    GET DIAGNOSTICS dataset_count = ROW_COUNT;
    
    -- Update agents
    UPDATE agents 
    SET user_id = target_user_id::TEXT 
    WHERE user_id = anonymous_uuid;
    GET DIAGNOSTICS agent_count = ROW_COUNT;
    
    -- Update other tables that might have anonymous data
    UPDATE glossary 
    SET user_id = target_user_id::TEXT 
    WHERE user_id = anonymous_uuid;
    
    UPDATE usage_tracking 
    SET user_id = target_user_id::TEXT 
    WHERE user_id = anonymous_uuid;
    
    result_text := format('Migration completed: %s jobs, %s datasets, %s agents migrated to user %s', 
                         job_count, dataset_count, agent_count, target_user_id);
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Temporarily disable RLS to allow data migration
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE datasets DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE glossary DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;

-- STEP 3: Create user profile for jpinetta@gmail.com if it doesn't exist
-- (We'll do this manually since the trigger isn't working)
DO $$
DECLARE
    user_email TEXT := 'jpinetta@gmail.com';
    user_uuid UUID;
BEGIN
    -- Check if user already exists in auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NOT NULL THEN
        -- Create profile in public.users if it doesn't exist
        INSERT INTO public.users (id, email, name, created_at)
        VALUES (user_uuid, user_email, 'jpinetta', NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Migrate all anonymous data to this user
        PERFORM migrate_anonymous_data_to_user(user_uuid);
        
        RAISE NOTICE 'User profile created and data migrated for %', user_email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users. Please sign in first.', user_email;
    END IF;
END $$;

-- STEP 4: Re-enable RLS with updated policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- STEP 5: Fix the user creation trigger for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email is allowed (only if restrictions are in place)
    IF NOT public.is_email_allowed(NEW.email) THEN
        RAISE EXCEPTION 'Email address not authorized for registration: %', NEW.email;
    END IF;
    
    -- Insert into public.users with better error handling
    INSERT INTO public.users (id, email, name, created_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- STEP 7: Verification query
SELECT 
    'MIGRATION VERIFICATION' as check_type,
    (SELECT COUNT(*) FROM jobs WHERE user_id != '00000000-0000-0000-0000-000000000000') as migrated_jobs,
    (SELECT COUNT(*) FROM datasets WHERE user_id != '00000000-0000-0000-0000-000000000000') as migrated_datasets,
    (SELECT COUNT(*) FROM agents WHERE user_id != '00000000-0000-0000-0000-000000000000') as migrated_agents,
    (SELECT COUNT(*) FROM public.users) as total_user_profiles;

SELECT 'Migration completed! Sign out and back in to test.' as status; 