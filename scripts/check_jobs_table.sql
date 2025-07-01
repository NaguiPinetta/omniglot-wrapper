-- Check the current structure of the jobs table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Check if all required columns exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'name') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as name_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'description') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as description_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'source_language') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as source_language_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'target_language') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as target_language_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'translation_instructions') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as translation_instructions_column,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'column_mapping') 
    THEN 'EXISTS' ELSE 'MISSING' 
  END as column_mapping_column; 