-- Add Additional Users for Magic Link Authentication
-- Run this in Supabase SQL Editor

-- Add the missing users to the users table
INSERT INTO public.users (id, email, name, role)
VALUES 
    (gen_random_uuid(), 'fchpriani@gmail.com', 'fchpriani', 'user'),
    (gen_random_uuid(), 'vtheimann@descartes.com', 'vtheimann', 'user')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verify all users are now in the table
SELECT 'All users verification:' as info;
SELECT email, name, role, created_at FROM users 
WHERE email IN (
    'vtheimann.dsg@gmail.com', 
    'naguipinetta@gmail.com', 
    'jbruno@descartes.com',
    'fchpriani@gmail.com',
    'vtheimann@descartes.com',
    'jpinetta@gmail.com'
)
ORDER BY email; 