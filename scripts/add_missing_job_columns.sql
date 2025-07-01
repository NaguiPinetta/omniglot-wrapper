-- Add column_mapping column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'column_mapping') THEN
        ALTER TABLE jobs ADD COLUMN column_mapping JSONB;
        RAISE NOTICE 'Added column_mapping column to jobs table';
    ELSE
        RAISE NOTICE 'column_mapping column already exists';
    END IF;
END $$;

-- Add completed_rows column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'completed_rows') THEN
        ALTER TABLE jobs ADD COLUMN completed_rows JSONB;
        RAISE NOTICE 'Added completed_rows column to jobs table';
    ELSE
        RAISE NOTICE 'completed_rows column already exists';
    END IF;
END $$;

-- Check if all expected columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN (
    'name', 'description', 'agent_id', 'dataset_id', 'glossary_id',
    'source_language', 'target_language', 'translation_instructions',
    'column_mapping', 'status', 'progress', 'total_items', 
    'processed_items', 'failed_items', 'started_at', 'completed_at',
    'error', 'user_id', 'created_at', 'updated_at'
)
ORDER BY column_name; 