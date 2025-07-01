-- Fix missing columns in api_keys and models tables

-- Add is_active column to api_keys if missing
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE public.api_keys SET is_active = true WHERE is_active IS NULL;

-- Add api_key_id column to models if missing  
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS api_key_id UUID;

-- Verify changes
SELECT 'api_keys columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'api_keys' 
ORDER BY ordinal_position;

SELECT 'models columns:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'models' 
ORDER BY ordinal_position;
