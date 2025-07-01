-- Complete Authentication Migration for Omniglot
-- This script implements full user authentication and authorization
-- Run this in your Supabase SQL editor

-- PHASE 1: Create Users Table and Basic Auth
-- =========================================

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PHASE 2: Update All Table RLS Policies
-- ======================================

-- AGENTS TABLE
DROP POLICY IF EXISTS "Allow anonymous read access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous insert access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous update access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous delete access on agents" ON agents;

CREATE POLICY "Users can view own agents" ON agents
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own agents" ON agents
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own agents" ON agents
  FOR DELETE USING (auth.uid()::text = user_id);

-- DATASETS TABLE
DROP POLICY IF EXISTS "Allow anonymous read access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous insert access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous update access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous delete access on datasets" ON datasets;

CREATE POLICY "Users can view own datasets" ON datasets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own datasets" ON datasets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own datasets" ON datasets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own datasets" ON datasets
  FOR DELETE USING (auth.uid()::text = user_id);

-- JOBS TABLE
DROP POLICY IF EXISTS "Allow anonymous read access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous insert access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous update access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous delete access on jobs" ON jobs;

CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid()::text = user_id);

-- GLOSSARY TABLE
DROP POLICY IF EXISTS "Allow anonymous read access on glossary" ON glossary;
DROP POLICY IF EXISTS "Allow anonymous insert access on glossary" ON glossary;
DROP POLICY IF EXISTS "Allow anonymous update access on glossary" ON glossary;
DROP POLICY IF EXISTS "Allow anonymous delete access on glossary" ON glossary;

CREATE POLICY "Users can view accessible glossary entries" ON glossary
  FOR SELECT USING (
    module_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM modules 
      WHERE modules.id = glossary.module_id 
      AND modules.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create glossary entries in own modules" ON glossary
  FOR INSERT WITH CHECK (
    module_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM modules 
      WHERE modules.id = glossary.module_id 
      AND modules.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update glossary entries in own modules" ON glossary
  FOR UPDATE USING (
    module_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM modules 
      WHERE modules.id = glossary.module_id 
      AND modules.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete glossary entries in own modules" ON glossary
  FOR DELETE USING (
    module_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM modules 
      WHERE modules.id = glossary.module_id 
      AND modules.user_id = auth.uid()::text
    )
  );

-- MODULES TABLE
DROP POLICY IF EXISTS "Allow read access to modules" ON modules;

-- Add user_id column to modules table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'modules' AND column_name = 'user_id') THEN
        ALTER TABLE modules ADD COLUMN user_id TEXT;
        RAISE NOTICE 'Added user_id column to modules table';
    END IF;
END $$;

CREATE POLICY "Users can view own modules" ON modules
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own modules" ON modules
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own modules" ON modules
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own modules" ON modules
  FOR DELETE USING (auth.uid()::text = user_id);

-- TRANSLATIONS TABLE
CREATE POLICY "Users can view translations from own jobs" ON translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = translations.job_id 
      AND jobs.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create translations for own jobs" ON translations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = translations.job_id 
      AND jobs.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update translations from own jobs" ON translations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = translations.job_id 
      AND jobs.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete translations from own jobs" ON translations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = translations.job_id 
      AND jobs.user_id = auth.uid()::text
    )
  );

-- USAGE_TRACKING TABLE
DROP POLICY IF EXISTS "Allow read access to usage_tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Allow insert access to usage_tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Allow update access to usage_tracking" ON usage_tracking;

CREATE POLICY "Users can view own usage tracking" ON usage_tracking
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own usage records" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own usage records" ON usage_tracking
  FOR UPDATE USING (auth.uid()::text = user_id);

-- PHASE 3: Auth Functions and Triggers
-- ====================================

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PHASE 4: Data Migration
-- =======================

-- Migrate existing data from anonymous UUID to proper user ownership
-- For now, we'll leave existing data with the anonymous UUID
-- In production, you might want to assign this data to a specific admin user

-- PHASE 5: Permissions
-- ===================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

SELECT 'Authentication migration completed successfully! 🎉' as status; 