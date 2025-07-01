-- Fix User Table RLS Policies
-- The trigger needs to be able to insert into users table

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create more permissive policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow the trigger function to insert new users
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Make sure the handle_new_user function can bypass RLS
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

SELECT 'User policies fixed!' as status; 