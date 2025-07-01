-- Check the user's UUID in auth.users
SELECT 'Auth User:' as type, id, email FROM auth.users WHERE email = 'jdpinetta@gmail.com';

-- Check the user's profile
SELECT 'User Profile:' as type, id, email FROM public.users WHERE email = 'jdpinetta@gmail.com';

-- Check sample of jobs owned by this user
SELECT 'Jobs Count:' as type, COUNT(*) as count FROM jobs WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com'
);

-- Check sample of agents owned by this user  
SELECT 'Agents Count:' as type, COUNT(*) as count FROM agents WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com'
);

-- Check sample of datasets owned by this user
SELECT 'Datasets Count:' as type, COUNT(*) as count FROM datasets WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jdpinetta@gmail.com'
);

-- Test RLS by checking what auth.uid() returns (this should match the user's UUID)
SELECT 'Current auth.uid():' as type, auth.uid() as uuid;
