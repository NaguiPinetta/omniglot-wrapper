-- Complete fix for agents table and related issues
-- Run this in your Supabase SQL Editor

-- 1. Check current table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Rename 'name' column to 'custom_name' if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE agents RENAME COLUMN name TO custom_name;
        RAISE NOTICE 'Renamed name column to custom_name';
    ELSE
        RAISE NOTICE 'Column name does not exist, skipping rename';
    END IF;
END $$;

-- 3. Ensure all required columns exist
DO $$ 
BEGIN
    -- Add custom_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'custom_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE agents ADD COLUMN custom_name TEXT;
        RAISE NOTICE 'Added custom_name column';
    END IF;
    
    -- Add temperature if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'temperature' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE agents ADD COLUMN temperature DECIMAL DEFAULT 0.7;
        RAISE NOTICE 'Added temperature column';
    END IF;
    
    -- Add top_p if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'top_p' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE agents ADD COLUMN top_p DECIMAL DEFAULT 1.0;
        RAISE NOTICE 'Added top_p column';
    END IF;
END $$;

-- 4. Update any null values
UPDATE agents 
SET custom_name = COALESCE(custom_name, 'Unnamed Agent ' || EXTRACT(EPOCH FROM created_at)::text)
WHERE custom_name IS NULL OR custom_name = '';

UPDATE agents 
SET temperature = 0.7 
WHERE temperature IS NULL;

UPDATE agents 
SET top_p = 1.0 
WHERE top_p IS NULL;

-- 5. Remove duplicates (keep most recent)
DELETE FROM agents 
WHERE id NOT IN (
    SELECT DISTINCT ON (custom_name, model, prompt) id
    FROM agents 
    ORDER BY custom_name, model, prompt, created_at DESC
);

-- 6. Show final structure and data
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'agents' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT id, custom_name, model, model_provider, temperature, top_p, created_at 
FROM agents 
ORDER BY created_at; 