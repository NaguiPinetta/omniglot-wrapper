-- FINAL DATA MIGRATION: Transfer all data to authenticated user
-- Run this in Supabase SQL Editor

-- Step 1: Find the real user UUID
SELECT 
  'Current authenticated user UUID:' as info,
  id as user_uuid,
  email
FROM users 
WHERE email = 'jdpinetta@gmail.com';

-- Step 2: Verify current data ownership
SELECT 
  'Current data ownership:' as info,
  'agents' as table_name,
  user_id,
  COUNT(*) as count
FROM agents 
GROUP BY user_id

UNION ALL

SELECT 
  'Current data ownership:' as info,
  'jobs' as table_name,
  user_id,
  COUNT(*) as count
FROM jobs 
GROUP BY user_id

UNION ALL

SELECT 
  'Current data ownership:' as info,
  'datasets' as table_name,
  user_id,
  COUNT(*) as count
FROM datasets 
GROUP BY user_id;

-- Step 3: Get the target user UUID (replace this with actual UUID from Step 1)
-- First, let's find it automatically
DO $$
DECLARE
  target_user_uuid UUID;
  anonymous_uuid UUID := '00000000-0000-0000-0000-000000000000';
  agents_migrated INTEGER;
  jobs_migrated INTEGER;
  datasets_migrated INTEGER;
  translations_migrated INTEGER;
BEGIN
  -- Get the target user UUID
  SELECT id INTO target_user_uuid 
  FROM users 
  WHERE email = 'jdpinetta@gmail.com';
  
  IF target_user_uuid IS NULL THEN
    RAISE EXCEPTION 'User jdpinetta@gmail.com not found';
  END IF;
  
  RAISE NOTICE 'Target user UUID: %', target_user_uuid;
  RAISE NOTICE 'Anonymous UUID: %', anonymous_uuid;
  
  -- Migrate agents
  UPDATE agents 
  SET user_id = target_user_uuid 
  WHERE user_id = anonymous_uuid;
  
  GET DIAGNOSTICS agents_migrated = ROW_COUNT;
  RAISE NOTICE 'Migrated % agents', agents_migrated;
  
  -- Migrate jobs
  UPDATE jobs 
  SET user_id = target_user_uuid 
  WHERE user_id = anonymous_uuid;
  
  GET DIAGNOSTICS jobs_migrated = ROW_COUNT;
  RAISE NOTICE 'Migrated % jobs', jobs_migrated;
  
  -- Migrate datasets
  UPDATE datasets 
  SET user_id = target_user_uuid 
  WHERE user_id = anonymous_uuid;
  
  GET DIAGNOSTICS datasets_migrated = ROW_COUNT;
  RAISE NOTICE 'Migrated % datasets', datasets_migrated;
  
  -- Migrate translations (if they exist and have user_id column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'translations' AND column_name = 'user_id'
  ) THEN
    UPDATE translations 
    SET user_id = target_user_uuid 
    WHERE user_id = anonymous_uuid;
    
    GET DIAGNOSTICS translations_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % translations', translations_migrated;
  ELSE
    RAISE NOTICE 'Translations table does not have user_id column - skipping';
  END IF;
  
  -- Migrate glossary entries
  UPDATE glossary 
  SET user_id = target_user_uuid 
  WHERE user_id = anonymous_uuid;
  
  RAISE NOTICE 'Migration completed successfully!';
  
END $$;

-- Step 4: Verify migration results
SELECT 
  'POST-MIGRATION VERIFICATION:' as info,
  'agents' as table_name,
  user_id,
  COUNT(*) as count
FROM agents 
GROUP BY user_id

UNION ALL

SELECT 
  'POST-MIGRATION VERIFICATION:' as info,
  'jobs' as table_name,
  user_id,
  COUNT(*) as count
FROM jobs 
GROUP BY user_id

UNION ALL

SELECT 
  'POST-MIGRATION VERIFICATION:' as info,
  'datasets' as table_name,
  user_id,
  COUNT(*) as count
FROM datasets 
GROUP BY user_id;

-- Step 5: Final verification - should show all data belongs to real user
SELECT 
  'FINAL COUNT CHECK:' as info,
  (SELECT COUNT(*) FROM agents WHERE user_id = (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com')) as agents_count,
  (SELECT COUNT(*) FROM jobs WHERE user_id = (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com')) as jobs_count,
  (SELECT COUNT(*) FROM datasets WHERE user_id = (SELECT id FROM users WHERE email = 'jdpinetta@gmail.com')) as datasets_count; 