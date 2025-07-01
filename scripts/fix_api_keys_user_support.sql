-- Fix api_keys table to support user authentication
-- Add user_id column and update RLS policies

-- Add user_id column to api_keys table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.api_keys ADD COLUMN user_id UUID;
        
        -- Set default user_id for existing records
        UPDATE public.api_keys 
        SET user_id = '00000000-0000-0000-0000-000000000000' 
        WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL with default
        ALTER TABLE public.api_keys 
        ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000',
        ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Allow anonymous access to api_keys" ON public.api_keys;

-- Create new RLS policies that work with both authenticated and anonymous users
CREATE POLICY "Allow anonymous access to api_keys" 
ON public.api_keys 
FOR ALL 
USING (
    user_id = '00000000-0000-0000-0000-000000000000' OR 
    auth.uid() IS NULL OR 
    user_id = auth.uid()
) 
WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000' OR 
    auth.uid() IS NULL OR 
    user_id = auth.uid()
);

-- Ensure RLS is enabled
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
