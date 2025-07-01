-- Add missing columns to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS top_p DECIMAL(3,2) DEFAULT 1.0;

-- Show table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents' AND table_schema = 'public';
