-- Fix Data Ownership Migration
-- Transfer all data from anonymous user to jdpinetta@gmail.com

-- First, get the real user UUID
DO $$
DECLARE
    real_user_uuid UUID;
    anonymous_uuid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Get the UUID for jdpinetta@gmail.com
    SELECT id INTO real_user_uuid 
    FROM auth.users 
    WHERE email = 'jdpinetta@gmail.com';
    
    IF real_user_uuid IS NULL THEN
        RAISE EXCEPTION 'User jdpinetta@gmail.com not found in auth.users';
    END IF;
    
    RAISE NOTICE 'Real user UUID: %', real_user_uuid;
    RAISE NOTICE 'Anonymous UUID: %', anonymous_uuid;
    
    -- Temporarily disable RLS for migration
    ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
    ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE datasets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE glossary DISABLE ROW LEVEL SECURITY;
    ALTER TABLE translations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;
    
    -- Update agents ownership
    UPDATE agents 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % agents', (SELECT COUNT(*) FROM agents WHERE user_id = real_user_uuid);
    
    -- Update jobs ownership
    UPDATE jobs 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % jobs', (SELECT COUNT(*) FROM jobs WHERE user_id = real_user_uuid);
    
    -- Update datasets ownership
    UPDATE datasets 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % datasets', (SELECT COUNT(*) FROM datasets WHERE user_id = real_user_uuid);
    
    -- Update glossary ownership
    UPDATE glossary 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % glossary entries', (SELECT COUNT(*) FROM glossary WHERE user_id = real_user_uuid);
    
    -- Update translations ownership
    UPDATE translations 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % translations', (SELECT COUNT(*) FROM translations WHERE user_id = real_user_uuid);
    
    -- Update usage_tracking ownership
    UPDATE usage_tracking 
    SET user_id = real_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    RAISE NOTICE 'Updated % usage tracking records', (SELECT COUNT(*) FROM usage_tracking WHERE user_id = real_user_uuid);
    
    -- Re-enable RLS
    ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
    ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Migration completed successfully!';
    
END $$; 