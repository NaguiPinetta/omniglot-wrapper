-- Make Modules User-Specific (Optional)
-- Run this ONLY if modules should be user-specific, not shared

-- Add user_id column to modules if it doesn't exist
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Update existing modules to assign them to the current user
-- (You may need to adjust this based on who should own existing modules)
UPDATE public.modules 
SET user_id = (SELECT id FROM users LIMIT 1)
WHERE user_id IS NULL;

-- Drop the shared policies
DROP POLICY IF EXISTS "Allow authenticated users to view modules" ON modules;
DROP POLICY IF EXISTS "Allow authenticated users to create modules" ON modules;
DROP POLICY IF EXISTS "Allow authenticated users to update modules" ON modules;
DROP POLICY IF EXISTS "Allow authenticated users to delete modules" ON modules;

-- Create user-specific policies
CREATE POLICY "Users can view own modules" ON modules
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own modules" ON modules
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own modules" ON modules
    FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own modules" ON modules
    FOR DELETE USING (user_id = auth.uid()::text); 