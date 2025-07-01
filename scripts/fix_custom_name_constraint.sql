-- Add constraint to prevent saving agents without a proper custom_name

-- First, fix any existing NULL or empty custom_name values
UPDATE agents 
SET custom_name = 'Agent ' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE custom_name IS NULL OR custom_name = '' OR TRIM(custom_name) = '';

-- Add NOT NULL constraint to custom_name column
ALTER TABLE agents 
ALTER COLUMN custom_name SET NOT NULL;

-- Add check constraint to ensure custom_name is not empty or just whitespace
ALTER TABLE agents 
ADD CONSTRAINT agents_custom_name_not_empty 
CHECK (LENGTH(TRIM(custom_name)) > 0);

-- Verify the constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'agents'::regclass;

-- Show current data
SELECT id, custom_name, model, created_at FROM agents ORDER BY created_at; 