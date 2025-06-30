-- Fix foreign key constraint for glossary_id in jobs table
-- The glossary_id should reference the modules table, not individual glossary entries

-- First, drop the existing foreign key constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_glossary_id_fkey;

-- Add the correct foreign key constraint pointing to modules table
ALTER TABLE jobs 
  ADD CONSTRAINT jobs_glossary_id_fkey 
  FOREIGN KEY (glossary_id) 
  REFERENCES modules(id) 
  ON DELETE SET NULL;

-- Also ensure the glossary_usage_mode column exists
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS glossary_usage_mode text DEFAULT 'prefer' 
  CHECK (glossary_usage_mode IN ('enforce', 'prefer', 'ignore')); 