-- Fix missing glossary_usage_mode column in jobs table
-- This column was added for the glossary integration feature

-- Add the glossary_usage_mode column if it doesn't exist
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS glossary_usage_mode text DEFAULT 'prefer' 
  CHECK (glossary_usage_mode IN ('enforce', 'prefer', 'ignore'));

-- Update any existing jobs to have the default value
UPDATE jobs 
SET glossary_usage_mode = 'prefer' 
WHERE glossary_usage_mode IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN jobs.glossary_usage_mode IS 'How to use glossary terms: enforce (strict), prefer (when applicable), ignore (skip glossary)';

-- Check if the column was added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'glossary_usage_mode'; 