-- Fix api_keys table - Add missing columns
-- This script adds the missing is_active column to the api_keys table

-- Check if is_active column exists and add it if missing
DO $$ 
BEGIN 
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.api_keys ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        
        -- Set all existing keys as active
        UPDATE public.api_keys SET is_active = true WHERE is_active IS NULL;
        
        RAISE NOTICE 'Added is_active column to api_keys table';
    ELSE
        RAISE NOTICE 'is_active column already exists in api_keys table';
    END IF;
    
    -- Add api_key_id column to models table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'models' 
        AND column_name = 'api_key_id'
    ) THEN
        ALTER TABLE public.models ADD COLUMN api_key_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE public.models 
        ADD CONSTRAINT fk_models_api_key 
        FOREIGN KEY (api_key_id) 
        REFERENCES public.api_keys(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added api_key_id column to models table';
    ELSE
        RAISE NOTICE 'api_key_id column already exists in models table';
    END IF;
END $$;

-- Verify the changes
SELECT 
    'api_keys' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_keys'
ORDER BY ordinal_position

UNION ALL

SELECT 
    'models' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'models'
AND column_name IN ('api_key_id', 'name', 'provider')
ORDER BY table_name, ordinal_position; 