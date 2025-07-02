-- Simplified Fix for Modules and Users
-- Run this in Supabase SQL Editor

-- ====================================
-- PART 1: Fix Modules Table
-- ====================================

-- Create modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own modules" ON modules;
DROP POLICY IF EXISTS "Users can insert their own modules" ON modules;
DROP POLICY IF EXISTS "Users can update their own modules" ON modules;
DROP POLICY IF EXISTS "Users can delete their own modules" ON modules;

-- Create new permissive policies
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

-- Add your teammates to the users table
INSERT INTO public.users (id, email, name, role)
VALUES 
    (gen_random_uuid(), 'vtheimann.dsg@gmail.com', 'vtheimann.dsg', 'user'),
    (gen_random_uuid(), 'naguipinetta@gmail.com', 'naguipinetta', 'user'),
    (gen_random_uuid(), 'jbruno@descartes.com', 'jbruno', 'user')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- ====================================
-- PART 3: Simple Verification
-- ====================================

-- Check modules table
SELECT COUNT(*) as module_count FROM modules;

-- Check users were added
SELECT email, name, role FROM users 
WHERE email IN ('vtheimann.dsg@gmail.com', 'naguipinetta@gmail.com', 'jbruno@descartes.com');
