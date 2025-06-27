-- Add missing columns to glossary table
ALTER TABLE glossary 
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS exceptions jsonb;

-- Also ensure module_id column exists
ALTER TABLE glossary 
  ADD COLUMN IF NOT EXISTS module_id uuid;

-- Make context nullable if it isn't already
ALTER TABLE glossary 
  ALTER COLUMN context DROP NOT NULL; 