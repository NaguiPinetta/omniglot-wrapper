-- Safe Translations Migration - Run in Supabase SQL Editor
-- This script adds user_id column to translations table with proper backfill

-- =============================================================================
-- STEP 1: SAFETY CHECKS
-- =============================================================================

-- Check current schema
SELECT 'Current translations columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'translations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_id already exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'translations' 
        AND column_name = 'user_id'
    ) THEN 'ERROR: user_id column already exists!'
    ELSE 'OK: user_id column does not exist'
  END as user_id_check;

-- Check jobs table for NULL user_id
SELECT 
  COUNT(*) as total_jobs,
  COUNT(user_id) as jobs_with_user_id,
  COUNT(*) - COUNT(user_id) as null_user_id_count,
  CASE 
    WHEN COUNT(*) - COUNT(user_id) > 0 THEN 'ERROR: Found NULL user_id in jobs!'
    ELSE 'OK: All jobs have user_id'
  END as safety_check
FROM jobs;

-- Check translations table stats
SELECT 
  COUNT(*) as total_translations,
  COUNT(DISTINCT job_id) as unique_job_ids,
  COUNT(CASE WHEN job_id IS NULL THEN 1 END) as null_job_ids
FROM translations;

-- =============================================================================
-- STEP 2: MIGRATION (Only run if safety checks pass)
-- =============================================================================

-- Add user_id column
ALTER TABLE translations ADD COLUMN user_id UUID;

-- Backfill user_id from jobs
UPDATE translations t
SET user_id = j.user_id
FROM jobs j
WHERE t.job_id = j.id;

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

-- Check backfill results
SELECT 
  'Backfill Results:' as info,
  COUNT(*) as total_translations,
  COUNT(user_id) as with_user_id,
  COUNT(*) - COUNT(user_id) as still_null,
  ROUND((COUNT(user_id)::numeric / COUNT(*) * 100), 2) as success_percentage
FROM translations;

-- Check for orphaned translations
SELECT 
  'Orphaned Translations Check:' as info,
  COUNT(*) as orphaned_count
FROM translations t
LEFT JOIN jobs j ON t.job_id = j.id
WHERE j.id IS NULL;

-- Show sample of orphaned translations (if any)
SELECT 
  'Sample Orphaned Translations:' as info,
  t.id, t.job_id, t.user_id
FROM translations t
LEFT JOIN jobs j ON t.job_id = j.id
WHERE j.id IS NULL
LIMIT 5;

-- =============================================================================
-- STEP 4: ADD CONSTRAINTS (Run only if verification passes)
-- =============================================================================

-- Add NOT NULL constraint (only if no NULLs remain)
-- Uncomment the next line only if verification shows 0 null user_ids:
-- ALTER TABLE translations ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE translations
ADD CONSTRAINT translations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

-- =============================================================================
-- STEP 5: FINAL VERIFICATION
-- =============================================================================

-- Final check
SELECT 
  'Final Migration Status:' as info,
  COUNT(*) as total_translations,
  COUNT(user_id) as with_user_id,
  COUNT(DISTINCT user_id) as unique_users,
  CASE 
    WHEN COUNT(*) = COUNT(user_id) THEN 'SUCCESS: All translations have user_id'
    ELSE 'WARNING: Some translations missing user_id'
  END as status
FROM translations;

-- Check constraint was added
SELECT 
  'Constraint Check:' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'translations'
  AND constraint_name = 'translations_user_id_fkey'; 