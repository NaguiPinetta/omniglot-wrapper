-- Simple Auth Setup - Just the essentials
-- Copy and paste this into Supabase SQL editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Basic user policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 4. Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Update main table policies to use user-based access
DROP POLICY IF EXISTS "Allow anonymous read access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous insert access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous update access on agents" ON agents;
DROP POLICY IF EXISTS "Allow anonymous delete access on agents" ON agents;

CREATE POLICY "Users own agents" ON agents FOR ALL USING (auth.uid()::TEXT = user_id);

DROP POLICY IF EXISTS "Allow anonymous read access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous insert access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous update access on datasets" ON datasets;
DROP POLICY IF EXISTS "Allow anonymous delete access on datasets" ON datasets;

CREATE POLICY "Users own datasets" ON datasets FOR ALL USING (auth.uid()::TEXT = user_id);

DROP POLICY IF EXISTS "Allow anonymous read access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous insert access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous update access on jobs" ON jobs;
DROP POLICY IF EXISTS "Allow anonymous delete access on jobs" ON jobs;

CREATE POLICY "Users own jobs" ON jobs FOR ALL USING (auth.uid()::TEXT = user_id);

-- Done!
SELECT 'Simple auth setup complete!' as status; 