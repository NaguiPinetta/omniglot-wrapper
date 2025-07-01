-- Fix modules table access for authenticated users
-- Run this in Supabase SQL Editor

-- Check current modules table structure
SELECT 'Current modules table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'modules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'modules';

-- Check existing policies
SELECT 'Existing policies:' as info;
SELECT policyname, command, roles
FROM pg_policies
WHERE tablename = 'modules';

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view their own modules" ON modules;
DROP POLICY IF EXISTS "Users can insert their own modules" ON modules;
DROP POLICY IF EXISTS "Users can update their own modules" ON modules;
DROP POLICY IF EXISTS "Users can delete their own modules" ON modules;

-- Create permissive policies for all authenticated users
-- (Since modules are typically shared resources)

-- Allow all authenticated users to view modules
CREATE POLICY "Allow authenticated users to view modules" ON modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to create modules
CREATE POLICY "Allow authenticated users to create modules" ON modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update modules
CREATE POLICY "Allow authenticated users to update modules" ON modules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to delete modules
CREATE POLICY "Allow authenticated users to delete modules" ON modules
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Verify the new policies
SELECT 'New policies created:' as info;
SELECT policyname, command, roles, using_expression
FROM pg_policies
WHERE tablename = 'modules';

-- Test access
SELECT 'Module access test:' as info;
SELECT COUNT(*) as total_modules FROM modules; 