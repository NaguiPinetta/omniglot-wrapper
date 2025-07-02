-- Add Missing Users Who Had Login Trouble
-- Run this in Supabase SQL Editor

-- Add the missing users back to fix their login issues
INSERT INTO public.users (id, email, name, role)
VALUES 
    (gen_random_uuid(), 'vtheimann.dsg@gmail.com', 'vtheimann.dsg', 'user'),
    (gen_random_uuid(), 'naguipinetta@gmail.com', 'naguipinetta', 'user'),
    (gen_random_uuid(), 'jbruno@descartes.com', 'jbruno', 'user')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verify all team users are now in the table
SELECT 'Team users verification:' as info;
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
