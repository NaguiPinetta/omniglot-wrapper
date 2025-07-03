-- Comprehensive RLS Policy Fix Script
-- This script removes restrictive per-user policies and creates permissive policies
-- for all authenticated users across all main tables

-- =============================================================================
-- DATASETS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only update their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can only delete their own datasets" ON datasets;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all datasets" ON datasets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert datasets" ON datasets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update datasets" ON datasets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete datasets" ON datasets
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- JOBS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can only insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can only update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can only delete their own jobs" ON jobs;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all jobs" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert jobs" ON jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update jobs" ON jobs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete jobs" ON jobs
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- AGENTS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own agents" ON agents;
DROP POLICY IF EXISTS "Users can only insert their own agents" ON agents;
DROP POLICY IF EXISTS "Users can only update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can only delete their own agents" ON agents;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all agents" ON agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert agents" ON agents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update agents" ON agents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete agents" ON agents
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MODELS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own models" ON models;
DROP POLICY IF EXISTS "Users can only insert their own models" ON models;
DROP POLICY IF EXISTS "Users can only update their own models" ON models;
DROP POLICY IF EXISTS "Users can only delete their own models" ON models;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all models" ON models
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert models" ON models
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update models" ON models
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete models" ON models
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- GLOSSARY TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own glossary" ON glossary;
DROP POLICY IF EXISTS "Users can only insert their own glossary" ON glossary;
DROP POLICY IF EXISTS "Users can only update their own glossary" ON glossary;
DROP POLICY IF EXISTS "Users can only delete their own glossary" ON glossary;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all glossary" ON glossary
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert glossary" ON glossary
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update glossary" ON glossary
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete glossary" ON glossary
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- TRANSLATIONS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own translations" ON translations;
DROP POLICY IF EXISTS "Users can only insert their own translations" ON translations;
DROP POLICY IF EXISTS "Users can only update their own translations" ON translations;
DROP POLICY IF EXISTS "Users can only delete their own translations" ON translations;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all translations" ON translations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert translations" ON translations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update translations" ON translations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete translations" ON translations
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- USAGE_TRACKING TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own usage_tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can only insert their own usage_tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can only update their own usage_tracking" ON usage_tracking;
DROP POLICY IF EXISTS "Users can only delete their own usage_tracking" ON usage_tracking;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all usage_tracking" ON usage_tracking
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert usage_tracking" ON usage_tracking
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update usage_tracking" ON usage_tracking
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete usage_tracking" ON usage_tracking
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- API_KEYS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can only insert their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can only update their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can only delete their own api_keys" ON api_keys;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all api_keys" ON api_keys
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert api_keys" ON api_keys
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update api_keys" ON api_keys
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete api_keys" ON api_keys
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MODULES TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own modules" ON modules;
DROP POLICY IF EXISTS "Users can only insert their own modules" ON modules;
DROP POLICY IF EXISTS "Users can only update their own modules" ON modules;
DROP POLICY IF EXISTS "Users can only delete their own modules" ON modules;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all modules" ON modules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert modules" ON modules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update modules" ON modules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete modules" ON modules
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- ALLOWED_EMAILS TABLE
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only see their own allowed_emails" ON allowed_emails;
DROP POLICY IF EXISTS "Users can only insert their own allowed_emails" ON allowed_emails;
DROP POLICY IF EXISTS "Users can only update their own allowed_emails" ON allowed_emails;
DROP POLICY IF EXISTS "Users can only delete their own allowed_emails" ON allowed_emails;

-- Create permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all allowed_emails" ON allowed_emails
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert allowed_emails" ON allowed_emails
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update allowed_emails" ON allowed_emails
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete allowed_emails" ON allowed_emails
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('datasets', 'jobs', 'agents', 'models', 'glossary', 'translations', 'usage_tracking', 'api_keys', 'modules', 'allowed_emails');

-- Show all current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('datasets', 'jobs', 'agents', 'models', 'glossary', 'translations', 'usage_tracking', 'api_keys', 'modules', 'allowed_emails')
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies updated successfully for all tables!' as status;