-- Fix agents table schema to support all required fields
-- Add missing columns if they don't exist

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agents' 
                   AND column_name = 'name') THEN
        ALTER TABLE public.agents ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Add temperature column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agents' 
                   AND column_name = 'temperature') THEN
        ALTER TABLE public.agents ADD COLUMN temperature DECIMAL(3,2) DEFAULT 0.7;
    END IF;
END $$;

-- Add top_p column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'agents' 
                   AND column_name = 'top_p') THEN
        ALTER TABLE public.agents ADD COLUMN top_p DECIMAL(3,2) DEFAULT 1.0;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agents'
ORDER BY ordinal_position;
 