-- Fix agents table to ensure name column exists
DO $$ 
BEGIN
    -- Check if name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'name'
    ) THEN
        ALTER TABLE agents ADD COLUMN name TEXT;
    END IF;
    
    -- Update existing agents that might not have names
    UPDATE agents 
    SET name = COALESCE(name, 'Agent ' || substr(id::text, 1, 8))
    WHERE name IS NULL OR name = '';
    
    -- Make name column NOT NULL
    ALTER TABLE agents ALTER COLUMN name SET NOT NULL;
    
    -- Add default value for future inserts
    ALTER TABLE agents ALTER COLUMN name SET DEFAULT 'New Agent';
END $$; 