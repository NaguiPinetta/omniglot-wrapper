-- Fix api_keys table schema
-- Drop existing table and policies
DROP POLICY IF EXISTS "Allow all operations on api_keys" ON public.api_keys;
DROP TABLE IF EXISTS public.api_keys;

-- Recreate api_keys table with correct schema
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    key_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on api_keys" ON public.api_keys
    FOR ALL USING (true) WITH CHECK (true);

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_keys'
ORDER BY ordinal_position; 