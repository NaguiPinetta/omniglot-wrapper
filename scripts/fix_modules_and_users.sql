-- Fix Modules Table Access and Add Required Users
-- Run this in Supabase SQL Editor

-- ====================================
-- PART 1: Fix Modules Table
-- ====================================

-- Check if modules table exists, if not create it
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on modules table
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own modules" ON modules;
DROP POLICY IF EXISTS "Users can insert their own modules" ON modules;
DROP POLICY IF EXISTS "Users can update their own modules" ON modules;
DROP POLICY IF EXISTS "Users can delete their own modules" ON modules;

-- Create permissive policies for authenticated users
-- Modules are typically shared resources that all users can access
CREATE POLICY "Allow authenticated users to view modules" ON modules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create modules" ON modules
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update modules" ON modules
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete modules" ON modules
    FOR DELETE TO authenticated USING (true);

-- ====================================
-- PART 2: Add Required Users
-- ====================================

-- Insert users into the users table
-- These will be created when they first sign in via magic link
INSERT INTO public.users (id, email, name, role)
VALUES 
    (gen_random_uuid(), 'vtheimann.dsg@gmail.com', 'vtheimann.dsg', 'user'),
    (gen_random_uuid(), 'naguipinetta@gmail.com', 'naguipinetta', 'user'),
    (gen_random_uuid(), 'jbruno@descartes.com', 'jbruno', 'user')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- ====================================
-- PART 3: Verification
-- ====================================

-- Verify modules table setup
SELECT 'Modules table verification:' as info;
SELECT COUNT(*) as module_count FROM modules;

-- Verify users added
SELECT 'Added users verification:' as info;
SELECT email, name, role, created_at FROM users 
WHERE email IN ('vtheimann.dsg@gmail.com', 'naguipinetta@gmail.com', 'jbruno@descartes.com')
ORDER BY email;

-- Verify RLS policies (fixed column names)
SELECT 'RLS policies verification:' as info;
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'modules'; 