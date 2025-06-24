-- Fix agents table: rename 'name' column to 'custom_name' to avoid conflicts
-- This will also help with the duplicate entries issue

-- First, let's see the current structure and data
SELECT * FROM agents;

-- Rename the column from 'name' to 'custom_name'
ALTER TABLE agents RENAME COLUMN name TO custom_name;

-- Update any null custom_name values to have a default
UPDATE agents 
SET custom_name = COALESCE(custom_name, 'Unnamed Agent ' || EXTRACT(EPOCH FROM created_at)::text)
WHERE custom_name IS NULL OR custom_name = '';

-- Remove any duplicate entries (keeping the most recent one)
DELETE FROM agents 
WHERE id NOT IN (
  SELECT DISTINCT ON (custom_name, model, prompt) id
  FROM agents 
  ORDER BY custom_name, model, prompt, created_at DESC
);

-- Verify the changes
SELECT id, custom_name, model, model_provider, created_at FROM agents ORDER BY created_at; 