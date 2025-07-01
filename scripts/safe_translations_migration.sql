-- Safe Translations Migration: Add user_id column with backfill
-- Execute each step and verify results before proceeding

-- =============================================================================
-- STEP 1: PRE-MIGRATION ANALYSIS
-- =============================================================================

-- Check if user_id column already exists in translations
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'translations' 
          AND column_name = 'user_id'
          AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'WARNING: user_id column already exists in translations table';
        RAISE EXCEPTION 'Migration aborted: user_id column already exists';
    ELSE
        RAISE NOTICE 'SAFE: user_id column does not exist in translations table';
    END IF;
END $$;

-- Check for NULL user_id values in jobs table
DO $$
DECLARE
    null_count INTEGER;
    total_jobs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_jobs FROM jobs;
    SELECT COUNT(*) INTO null_count FROM jobs WHERE user_id IS NULL;
    
    RAISE NOTICE 'Jobs analysis: % total jobs, % with NULL user_id', total_jobs, null_count;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migration aborted: % jobs have NULL user_id - must fix before migration', null_count;
    ELSE
        RAISE NOTICE 'SAFE: All jobs have valid user_id values';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: ADD USER_ID COLUMN
-- =============================================================================

-- Add user_id column to translations (initially nullable)
ALTER TABLE translations 
ADD COLUMN user_id UUID;

RAISE NOTICE 'SUCCESS: Added user_id column to translations table';

-- =============================================================================
-- STEP 3: BACKFILL USER_ID FROM JOBS
-- =============================================================================

-- Backfill user_id from jobs.user_id via job_id relationship
UPDATE translations t
SET user_id = j.user_id
FROM jobs j
WHERE t.job_id = j.id;

-- Get update statistics
DO $$
DECLARE
    total_translations INTEGER;
    updated_translations INTEGER;
    null_user_ids INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_translations FROM translations;
    SELECT COUNT(*) INTO updated_translations FROM translations WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO null_user_ids FROM translations WHERE user_id IS NULL;
    
    RAISE NOTICE 'Backfill results:';
    RAISE NOTICE '  Total translations: %', total_translations;
    RAISE NOTICE '  Successfully backfilled: %', updated_translations;
    RAISE NOTICE '  Remaining NULL user_ids: %', null_user_ids;
    
    IF null_user_ids > 0 THEN
        RAISE WARNING 'WARNING: % translations still have NULL user_id', null_user_ids;
        RAISE NOTICE 'These may be orphaned translations with invalid job_id references';
    ELSE
        RAISE NOTICE 'SUCCESS: All translations have valid user_id values';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: VERIFY DATA INTEGRITY
-- =============================================================================

-- Check for orphaned translations (translations with job_id that don't exist in jobs)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM translations t
    LEFT JOIN jobs j ON t.job_id = j.id
    WHERE j.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % orphaned translations with invalid job_id references', orphaned_count;
        
        -- Show details of orphaned translations
        RAISE NOTICE 'Orphaned translation details:';
        FOR rec IN 
            SELECT t.id, t.job_id, t.user_id
            FROM translations t
            LEFT JOIN jobs j ON t.job_id = j.id
            WHERE j.id IS NULL
            LIMIT 5
        LOOP
            RAISE NOTICE '  Translation ID: %, Job ID: %, User ID: %', rec.id, rec.job_id, rec.user_id;
        END LOOP;
    ELSE
        RAISE NOTICE 'SUCCESS: No orphaned translations found';
    END IF;
END $$;

-- =============================================================================
-- STEP 5: ADD CONSTRAINTS (CONDITIONAL)
-- =============================================================================

-- Only add NOT NULL constraint if no NULL values remain
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM translations WHERE user_id IS NULL;
    
    IF null_count = 0 THEN
        ALTER TABLE translations ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'SUCCESS: Added NOT NULL constraint to user_id column';
    ELSE
        RAISE WARNING 'SKIPPED: NOT NULL constraint not added due to % NULL values', null_count;
    END IF;
END $$;

-- Add foreign key constraint to users table
ALTER TABLE translations
ADD CONSTRAINT translations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

RAISE NOTICE 'SUCCESS: Added foreign key constraint translations_user_id_fkey';

-- =============================================================================
-- STEP 6: FINAL VERIFICATION
-- =============================================================================

-- Final verification of migration results
DO $$
DECLARE
    total_translations INTEGER;
    with_user_id INTEGER;
    unique_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_translations FROM translations;
    SELECT COUNT(*) INTO with_user_id FROM translations WHERE user_id IS NOT NULL;
    SELECT COUNT(DISTINCT user_id) INTO unique_users FROM translations WHERE user_id IS NOT NULL;
    
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'Final statistics:';
    RAISE NOTICE '  Total translations: %', total_translations;
    RAISE NOTICE '  With user_id: %', with_user_id;
    RAISE NOTICE '  Unique users: %', unique_users;
    RAISE NOTICE '  Success rate: %%%', ROUND((with_user_id::NUMERIC / total_translations * 100), 2);
END $$; 