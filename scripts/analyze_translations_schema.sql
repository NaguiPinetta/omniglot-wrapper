-- Step 1: Check if user_id column already exists in translations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'translations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check for any NULL user_id in jobs table
SELECT COUNT(*) AS total_jobs,
       COUNT(user_id) AS jobs_with_user_id,
       COUNT(*) - COUNT(user_id) AS null_user_id_count
FROM jobs;

-- Step 3: Check translations table structure and sample data
SELECT COUNT(*) AS total_translations
FROM translations;

-- Step 4: Check if all translations have valid job_id references
SELECT 
    COUNT(*) AS total_translations,
    COUNT(DISTINCT job_id) AS unique_job_ids,
    COUNT(CASE WHEN job_id IS NULL THEN 1 END) AS null_job_ids
FROM translations;

-- Step 5: Verify job_id foreign key relationship integrity
SELECT 
    t.job_id,
    COUNT(*) AS translation_count,
    CASE WHEN j.id IS NULL THEN 'ORPHANED' ELSE 'VALID' END AS status
FROM translations t
LEFT JOIN jobs j ON t.job_id = j.id
GROUP BY t.job_id, j.id
HAVING j.id IS NULL
LIMIT 10; 