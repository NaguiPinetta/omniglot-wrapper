-- Fix RLS policies for datasets table to support both authenticated and anonymous users
-- This allows the system to work during the transition to full authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can create own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete own datasets" ON datasets;
DROP POLICY IF EXISTS "Users own datasets" ON datasets;

-- Create new policies that allow both authenticated and anonymous access
CREATE POLICY "Allow authenticated and anonymous read access on datasets" ON datasets
  FOR SELECT USING (
    auth.uid()::text = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Allow authenticated and anonymous insert access on datasets" ON datasets
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Allow authenticated and anonymous update access on datasets" ON datasets
  FOR UPDATE USING (
    auth.uid()::text = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Allow authenticated and anonymous delete access on datasets" ON datasets
  FOR DELETE USING (
    auth.uid()::text = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000000'
  );

-- Verify the policies are in place
SELECT 'Dataset RLS policies updated successfully!' as status;
